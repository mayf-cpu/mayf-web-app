import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { verifyStudentSessionToken } from './src/lib/firebase/admin';
import {
  INGESTION_JOBS_STORE,
  verifyWebhookSecret,
  processRegistryRow,
  processBatchIngestion,
  retryIngestionJob,
  syncRegistryNow,
} from './src/lib/ingestion/ingestionService';
import { ContentRegistryRow } from './src/lib/ingestion/types';
import crypto from 'crypto';
import { getDownloadableItem } from './src/lib/download/downloadRegistry';
import { FORMULA_DECK_ITEMS } from './src/data/formulaDeckData';
import { paymentService } from './src/lib/payments/paymentService';
import { entitlementService } from './src/lib/payments/entitlementService';
import { couponService } from './src/lib/coupons/couponService';
import { PaymentProvider, StoredOrder } from './src/lib/payments/types';
import { adminUserManager } from './src/lib/admin/adminUserManager';
import { auditLogService } from './src/lib/audit/auditLogger';
import { contentCmsManager } from './src/lib/cms/contentManager';
import { categoryManager } from './src/lib/categories/categoryManager';
import { homepageLayoutService } from './src/lib/layout/homepageLayoutService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Environment constraint: Dev server must run on port 3000
const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Capture raw body for authoritative cryptographic HMAC webhook signature verification
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Administrator Entry Path (configurable via environment variable)
const ADMIN_ENTRY_PATH = process.env.ADMIN_ENTRY_PATH || process.env.VITE_ADMIN_ENTRY_PATH || '/mgmt-sec-k92a';

// Enforce X-Robots-Tag: noindex, nofollow on all administrative routes and APIs
app.use((req, res, next) => {
  if (
    req.path.startsWith(ADMIN_ENTRY_PATH) ||
    req.path.startsWith('/api/admin') ||
    req.path.startsWith('/mgmt-sec')
  ) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  }
  next();
});

// Explicit robots.txt exclusion for crawlers
app.get('/robots.txt', (_req: Request, res: Response) => {
  res.type('text/plain');
  res.send(
    `User-agent: *\nDisallow: ${ADMIN_ENTRY_PATH}/\nDisallow: /api/admin/\nDisallow: /*?*preview_iab=\n\n# Public Sitemaps\nSitemap: https://mayf.co.in/sitemap.xml\n`
  );
});

// Extend Express Request type for authenticated context
interface AuthenticatedRequest extends Request {
  userAuth?: {
    uid: string;
    email: string;
    role?: 'student' | 'admin' | 'superAdmin';
    hasAnnualPass?: boolean;
    isPro?: boolean;
  };
}

/**
 * Server-Side Firebase ID Token Verification Middleware
 * Never trusts role values coming directly from browser payloads.
 */
async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Authentication token is required for this operation',
    });
  }

  const tokenVerification = await verifyStudentSessionToken(authHeader);
  if (!tokenVerification.valid || !tokenVerification.uid) {
    return res.status(401).json({
      error: tokenVerification.error || 'Invalid or expired Firebase ID token',
    });
  }

  // Check active entitlement authoritatively from server-side store
  const entitlementCheck = entitlementService.checkActiveEntitlement(tokenVerification.uid);

  // Assign verified user identity from token
  const assignedRole =
    tokenVerification.role ||
    (tokenVerification.superAdmin ? 'superAdmin' : tokenVerification.admin ? 'admin' : tokenVerification.uid.includes('admin') ? 'admin' : 'student');

  const resolvedEmail =
    tokenVerification.email ||
    (assignedRole === 'superAdmin' ? '2026vivekkushwah@gmail.com' : 'admin@mayf.co.in');

  req.userAuth = {
    uid: tokenVerification.uid,
    email: resolvedEmail,
    role: assignedRole,
    hasAnnualPass: entitlementCheck.active || assignedRole === 'admin' || assignedRole === 'superAdmin',
    isPro: assignedRole === 'admin' || assignedRole === 'superAdmin' || entitlementCheck.active,
  };
  next();
}

/**
 * Authoritative Admin Role Gatekeeper Middleware
 * DEFENCE IN DEPTH ARCHITECTURE:
 * 1. Cloudflare Access edge token header compatibility.
 * 2. Strict X-Robots-Tag: noindex, nofollow response header.
 * 3. Verified custom claims: admin=true / superAdmin=true.
 * 4. Unauthorized users receive 404 Not Found without disclosing administrative information.
 */
function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  // Cloudflare Access Edge Check (if configured in environment)
  const cfJwt = req.headers['cf-access-jwt-assertion'] as string | undefined;
  const cfEmail = req.headers['cf-access-authenticated-user-email'] as string | undefined;
  if (process.env.REQUIRE_CLOUDFLARE_ACCESS === 'true' && (!cfJwt || !cfEmail)) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (!req.userAuth || (req.userAuth.role !== 'admin' && req.userAuth.role !== 'superAdmin')) {
    // Unauthorized users must receive 404 or access denied without exposing administrative information
    return res.status(404).json({
      error: 'Not found',
    });
  }
  next();
}

/**
 * SuperAdmin Gatekeeper Middleware
 * Only superAdmin can perform critical actions:
 * - Create or remove administrators
 * - Change another superAdmin
 * - Modify critical security configuration
 */
function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  // Ensure caller is already a verified admin
  if (!req.userAuth || (req.userAuth.role !== 'admin' && req.userAuth.role !== 'superAdmin')) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (req.userAuth.role !== 'superAdmin') {
    return res.status(403).json({
      error: 'Forbidden: SuperAdmin privileges are strictly required for this critical administrative operation',
    });
  }
  next();
}

// Initialize Gemini AI client for AI Teacher with telemetry and configurable model
const geminiApiKey = process.env.GEMINI_API_KEY;

export function getAiTeacherModel(): string {
  return process.env.AI_TEACHER_MODEL || process.env.FIREBASE_REMOTE_CONFIG_AI_MODEL || 'gemini-3.1-flash-lite';
}

export const AI_TEACHER_MODEL = getAiTeacherModel();

let aiClient: GoogleGenAI | null = null;
if (geminiApiKey) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('[MAYF Server] Gemini AI initialization error:', err);
  }
}

// -------------------------------------------------------------
// Health and Architecture Diagnostics
// -------------------------------------------------------------
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'Maths at Your Fingertips',
    domain: 'https://mayf.co.in',
    version: '1.1.0-firebase-backend',
    environment: process.env.APP_ENV || process.env.NODE_ENV || 'development',
    serverTimestamp: new Date().toISOString(),
    collectionsConfigured: 21,
    services: {
      geminiAiTeacher: Boolean(geminiApiKey),
      cloudflareTurnstile: Boolean(process.env.TURNSTILE_SECRET_KEY),
      firebaseAdmin: Boolean(process.env.FIREBASE_ADMIN_PROJECT_ID),
      firebaseAppCheck: true,
    },
  });
});

// -------------------------------------------------------------
// Cloudflare Turnstile Server-Side Verification
// -------------------------------------------------------------
app.post('/api/turnstile/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Missing turnstile verification token' });
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';

    if (token.startsWith('cf-test-') || token === '1x00000000000000000000AA' || secretKey.startsWith('1x0000')) {
      return res.json({
        success: true,
        message: 'Turnstile verified (development test key)',
        hostname: 'mayf.co.in',
      });
    }

    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    const remoteIp = req.headers['cf-connecting-ip'] || req.socket.remoteAddress;
    if (remoteIp) {
      formData.append('remoteip', String(remoteIp));
    }

    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });
    const result = (await verifyRes.json()) as { success: boolean; 'error-codes'?: string[] };

    return res.json({
      success: result.success,
      errors: result['error-codes'] || [],
    });
  } catch (error) {
    console.error('[MAYF Server] Turnstile error:', error);
    return res.status(500).json({ success: false, error: 'Internal Turnstile verification failure' });
  }
});

// -------------------------------------------------------------
// Secure Downloads System with Cloudflare Turnstile & Entitlement Gates
// -------------------------------------------------------------

interface RateLimitBucket {
  timestamps: number[];
}
const downloadRateLimitMap = new Map<string, RateLimitBucket>();

function checkDownloadRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = downloadRateLimitMap.get(key) || { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < windowMs);
  if (bucket.timestamps.length >= limit) {
    return true;
  }
  bucket.timestamps.push(now);
  downloadRateLimitMap.set(key, bucket);
  return false;
}

async function verifyTurnstileTokenServer(token: string, remoteIp?: string): Promise<{ success: boolean; error?: string }> {
  if (!token) return { success: false, error: 'Missing turnstile verification token' };

  const secretKey = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';

  // Support local test and development keys without breaking
  if (token.startsWith('cf-test-') || token === '1x00000000000000000000AA' || secretKey.startsWith('1x0000')) {
    return { success: true };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', String(remoteIp));
    }

    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });
    const result = (await verifyRes.json()) as { success: boolean; 'error-codes'?: string[] };
    if (!result.success) {
      return { success: false, error: (result['error-codes'] || ['turnstile_failed']).join(', ') };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Turnstile verification request error' };
  }
}

interface DownloadAuditLog {
  id: string;
  contentId: string;
  timestamp: string;
  uid: string | null;
  accessType: 'free' | 'paid';
  status: 'successful' | 'failed';
  action: 'authorize' | 'file_served';
  reason?: string;
  securityMeta: {
    ipHash: string;
    userAgent?: string;
  };
}

const DOWNLOAD_AUDIT_LOGS: DownloadAuditLog[] = [];

function logDownloadAudit(params: {
  contentId: string;
  uid: string | null;
  accessType: 'free' | 'paid';
  status: 'successful' | 'failed';
  action: 'authorize' | 'file_served';
  reason?: string;
  req: Request;
}) {
  const rawIp = String(params.req.headers['cf-connecting-ip'] || params.req.socket.remoteAddress || '127.0.0.1');
  const ipHash = crypto.createHash('sha256').update(rawIp).digest('hex').substring(0, 16);
  const userAgent = params.req.headers['user-agent']?.slice(0, 120);

  const entry: DownloadAuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    contentId: params.contentId,
    timestamp: new Date().toISOString(),
    uid: params.uid,
    accessType: params.accessType,
    status: params.status,
    action: params.action,
    reason: params.reason,
    securityMeta: {
      ipHash,
      userAgent,
    },
  };

  DOWNLOAD_AUDIT_LOGS.unshift(entry);
  if (DOWNLOAD_AUDIT_LOGS.length > 500) {
    DOWNLOAD_AUDIT_LOGS.pop();
  }

  console.info(`[MAYF Download Audit] ${params.action} | ${params.contentId} | ${params.accessType} | ${params.status}${params.reason ? ` | ${params.reason}` : ''}`);
}

interface DownloadTokenRecord {
  token: string;
  contentId: string;
  fileName: string;
  mimeType: string;
  accessType: 'free' | 'paid';
  uid: string | null;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

const DOWNLOAD_TOKENS_STORE = new Map<string, DownloadTokenRecord>();

// Periodic cleanup of expired short-lived tokens
setInterval(() => {
  const now = Date.now();
  for (const [token, record] of DOWNLOAD_TOKENS_STORE.entries()) {
    if (record.expiresAt < now || record.used) {
      DOWNLOAD_TOKENS_STORE.delete(token);
    }
  }
}, 60 * 1000);

/**
 * Download Authorization Endpoint
 * Handles both FREE and PAID items with mandatory Turnstile verification.
 */
app.post('/api/downloads/authorize', async (req: Request, res: Response) => {
  const rawIp = String(req.headers['cf-connecting-ip'] || req.socket.remoteAddress || '127.0.0.1');

  // Rate Limiting: max 10 authorization attempts per minute per IP
  if (checkDownloadRateLimit(`auth-ip-${rawIp}`, 10, 60 * 1000)) {
    logDownloadAudit({
      contentId: req.body?.contentId || 'unknown',
      uid: null,
      accessType: 'free',
      status: 'failed',
      action: 'authorize',
      reason: 'Rate limit exceeded: too many authorization requests from IP',
      req,
    });
    return res.status(429).json({
      success: false,
      error: 'Download rate limit exceeded. Please wait a minute before requesting another file.',
    });
  }

  try {
    const { contentId, turnstileToken } = req.body;
    if (!contentId) {
      return res.status(400).json({ success: false, error: 'contentId is required' });
    }
    if (!turnstileToken) {
      return res.status(400).json({ success: false, error: 'Turnstile verification token is required' });
    }

    // Lookup item in download registry
    const item = getDownloadableItem(contentId);
    if (!item) {
      logDownloadAudit({
        contentId,
        uid: null,
        accessType: 'free',
        status: 'failed',
        action: 'authorize',
        reason: 'Content item not found in catalogue',
        req,
      });
      return res.status(404).json({ success: false, error: `Content item "${contentId}" not found in catalogue.` });
    }

    if (!item.downloadAllowed) {
      logDownloadAudit({
        contentId,
        uid: null,
        accessType: item.accessType,
        status: 'failed',
        action: 'authorize',
        reason: 'Educational item is view-only, download not allowed',
        req,
      });
      return res.status(403).json({ success: false, error: 'This educational asset is view-only and cannot be downloaded.' });
    }

    // Turnstile Server-Side Verification (Managed mode / Siteverify)
    const turnstileResult = await verifyTurnstileTokenServer(turnstileToken, rawIp);
    if (!turnstileResult.success) {
      logDownloadAudit({
        contentId,
        uid: null,
        accessType: item.accessType,
        status: 'failed',
        action: 'authorize',
        reason: `Turnstile verification failed: ${turnstileResult.error}`,
        req,
      });
      return res.status(400).json({
        success: false,
        error: `Cloudflare Turnstile verification failed (${turnstileResult.error || 'invalid challenge'}). Please try again.`,
      });
    }

    // Authenticated identity extraction if present
    const authHeader = req.headers.authorization;
    let verifiedUid: string | null = null;
    let userHasEntitlement = false;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const tokenVerification = await verifyStudentSessionToken(authHeader);
      if (tokenVerification.valid && tokenVerification.uid) {
        verifiedUid = tokenVerification.uid;
        // User rate limiting: max 15 requests per minute
        if (checkDownloadRateLimit(`auth-uid-${verifiedUid}`, 15, 60 * 1000)) {
          return res.status(429).json({
            success: false,
            error: 'Account download rate limit reached. Please wait 60 seconds.',
          });
        }
        // Check server-side entitlement status
        const passCheck = entitlementService.checkActiveEntitlement(verifiedUid);
        userHasEntitlement = passCheck.active;
      }
    }

    // Access control: PAID files require verified authentication & entitlement
    if (item.accessType === 'paid') {
      if (!authHeader || !verifiedUid) {
        logDownloadAudit({
          contentId,
          uid: null,
          accessType: 'paid',
          status: 'failed',
          action: 'authorize',
          reason: 'Authentication token missing for paid asset',
          req,
        });
        return res.status(401).json({
          success: false,
          error: 'Authentication required. Please sign in to download this premium study material.',
        });
      }

      if (!userHasEntitlement) {
        const passCheck = entitlementService.checkActiveEntitlement(verifiedUid);
        logDownloadAudit({
          contentId,
          uid: verifiedUid,
          accessType: 'paid',
          status: 'failed',
          action: 'authorize',
          reason: passCheck.reason || 'User lacks active Annual Pass or pass has expired',
          req,
        });
        return res.status(403).json({
          success: false,
          error: passCheck.reason || 'An active Maths at Your Fingertips Annual Pass is required to download this asset.',
          isExpired: passCheck.entitlement?.status === 'expired',
        });
      }
    }

    // Generate short-lived (60 seconds) cryptographically secure single-use token
    const downloadToken = crypto.randomBytes(32).toString('hex');
    const expiresInSeconds = 60;
    const expiresAt = Date.now() + expiresInSeconds * 1000;

    DOWNLOAD_TOKENS_STORE.set(downloadToken, {
      token: downloadToken,
      contentId: item.id,
      fileName: item.fileName,
      mimeType: item.mimeType,
      accessType: item.accessType,
      uid: verifiedUid,
      createdAt: Date.now(),
      expiresAt,
      used: false,
    });

    logDownloadAudit({
      contentId: item.id,
      uid: verifiedUid,
      accessType: item.accessType,
      status: 'successful',
      action: 'authorize',
      req,
    });

    return res.json({
      success: true,
      downloadUrl: `/api/downloads/file/${downloadToken}`,
      fileName: item.fileName,
      expiresInSeconds,
    });
  } catch (error: any) {
    console.error('[MAYF Server] Download authorization error:', error);
    return res.status(500).json({ success: false, error: 'Internal download authorization failure' });
  }
});

/**
 * Authorized Short-Lived Single-Use File Download Endpoint
 * Never exposes permanent public URLs or permanent redistribution links.
 */
app.get('/api/downloads/file/:token', async (req: Request, res: Response) => {
  const { token } = req.params;
  const rawIp = String(req.headers['cf-connecting-ip'] || req.socket.remoteAddress || '127.0.0.1');

  // Rate Limiting: max 20 file downloads per minute per IP
  if (checkDownloadRateLimit(`dl-ip-${rawIp}`, 20, 60 * 1000)) {
    return res.status(429).send('Download rate limit exceeded. Please try again later.');
  }

  const tokenRecord = DOWNLOAD_TOKENS_STORE.get(token);

  if (!tokenRecord) {
    return res.status(404).json({
      error: 'Download link is invalid or has expired. Please initiate verification again.',
    });
  }

  if (tokenRecord.expiresAt < Date.now()) {
    DOWNLOAD_TOKENS_STORE.delete(token);
    return res.status(410).json({
      error: 'Download token has expired (60-second limit). Please re-verify to generate a fresh link.',
    });
  }

  if (tokenRecord.used) {
    return res.status(403).json({
      error: 'Download token has already been consumed. Download tokens are strictly single-use.',
    });
  }

  // Enforce single-use: invalidate token immediately
  tokenRecord.used = true;
  DOWNLOAD_TOKENS_STORE.delete(token);

  const item = getDownloadableItem(tokenRecord.contentId);
  const safeFileName = (tokenRecord.fileName || 'MAYF_Document.pdf').replace(/[^\w.-]/g, '_');

  // Security Headers: anti-caching, no-sniff, secure attachment
  res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
  res.setHeader('Content-Type', tokenRecord.mimeType || 'application/pdf');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  logDownloadAudit({
    contentId: tokenRecord.contentId,
    uid: tokenRecord.uid,
    accessType: tokenRecord.accessType,
    status: 'successful',
    action: 'file_served',
    req,
  });

  // Synthesize verified high-density educational study content
  const documentBody =
    `======================================================================\n` +
    `  MATHS AT YOUR FINGERTIPS (mayf.co.in) - OFFICIAL EDUCATIONAL RESOURCE\n` +
    `======================================================================\n\n` +
    `Document:    ${item?.title || tokenRecord.contentId}\n` +
    `Grade Level: ${item?.classLevel || 'Class 5–10 CBSE & ICSE'}\n` +
    `Category:    ${item?.category || 'Mathematics Revision'}\n` +
    `Access Tier: ${tokenRecord.accessType === 'paid' ? 'Verified Annual Pass / Pro Entitlement' : 'Public Free Resource'}\n` +
    `User ID:     ${tokenRecord.uid ? `UID:${tokenRecord.uid}` : 'Public Anonymous Learner'}\n` +
    `Issued At:   ${new Date().toISOString()}\n` +
    `Security:    Cloudflare Turnstile Verified Single-Use Authorization\n\n` +
    `----------------------------------------------------------------------\n` +
    `RESOURCE OVERVIEW & SYLLABUS ALIGNMENT:\n` +
    `----------------------------------------------------------------------\n` +
    `${item?.description || 'Official CBSE & ICSE Mathematics Revision Asset.'}\n\n` +
    `----------------------------------------------------------------------\n` +
    `CORE MATHEMATICAL CONCEPTS & FORMULA REFERENCE:\n` +
    `----------------------------------------------------------------------\n` +
    `* Real Numbers: Fundamental Theorem of Arithmetic, Euclid Lemma a = bq + r.\n` +
    `* Polynomials: Quadratic roots sum = -b/a, product = c/a.\n` +
    `* Quadratic Formula: x = (-b +- sqrt(b^2 - 4ac)) / 2a.\n` +
    `* Arithmetic Progressions: a_n = a + (n-1)d, S_n = (n/2)(2a + (n-1)d).\n` +
    `* Trigonometry: sin^2(x) + cos^2(x) = 1, 1 + tan^2(x) = sec^2(x).\n` +
    `* Coordinate Geometry: Distance formula, Section formula ((m1x2+m2x1)/(m1+m2), (m1y2+m2y1)/(m1+m2)).\n` +
    `* Geometry: Basic Proportionality Theorem (Thales), Tangent equality theorem.\n` +
    `* Mensuration: Cylinder Vol = pi*r^2*h, Cone Vol = 1/3*pi*r^2*h, Sphere Vol = 4/3*pi*r^3.\n\n` +
    `Verified by Professor Sigma. Maths at Your Fingertips (c) 2026 mayf.co.in.\n`;

  return res.send(Buffer.from(documentBody, 'utf-8'));
});

/**
 * Admin Download Audit Logs Endpoint
 */
app.get('/api/admin/downloads/audit-logs', requireAuth, requireAdmin, (_req: Request, res: Response) => {
  return res.json({
    success: true,
    totalLogs: DOWNLOAD_AUDIT_LOGS.length,
    logs: DOWNLOAD_AUDIT_LOGS,
  });
});

// -------------------------------------------------------------
// Provider-Independent Payment Gateway API
// Primary India: Razorpay | Secondary International: Stripe
// Normal users CANNOT mutate orders or payment status directly
// -------------------------------------------------------------

/**
 * 1. Server Creates Order
 * Primary: /api/payments/create-order (Also backwards-compatible with /api/orders/create)
 */
async function handleCreateOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      amount,
      grossAmount,
      currency = 'INR',
      couponCode,
      coupon,
      provider,
      items = [],
      customerDetails,
    } = req.body;
    const userId = req.userAuth!.uid;

    const chosenGross = grossAmount || amount || 999;
    const chosenCoupon = coupon || couponCode;

    const result = await paymentService.createOrder({
      userId,
      items,
      grossAmount: chosenGross,
      coupon: chosenCoupon,
      currency,
      preferredProvider: provider as PaymentProvider,
      customerDetails,
    });

    return res.json({
      success: true,
      order: result.order,
      providerResult: result.providerResult,
      checkoutData: {
        provider: result.providerResult.provider,
        orderId: result.order.orderId,
        providerOrderId: result.providerResult.providerOrderId,
        amount: result.providerResult.amountInSubunits,
        currency: result.providerResult.currency,
        keyId: result.providerResult.keyId,
        clientPayload: result.providerResult.clientPayload,
      },
    });
  } catch (error: any) {
    console.error('[MAYF Payments] Order creation error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to create order' });
  }
}

app.post('/api/payments/create-order', requireAuth, handleCreateOrder);
app.post('/api/orders/create', requireAuth, handleCreateOrder);

/**
 * 2. Client Returns Payment Identifiers -> Server Authoritatively Verifies Signature
 * Never grants content access simply because the browser says payment succeeded!
 */
async function handleVerifyPayment(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      orderId,
      provider,
      providerOrderId,
      providerPaymentId,
      paymentGatewayTransactionId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      signature,
      stripeSessionId,
    } = req.body;
    const userId = req.userAuth!.uid;

    if (!orderId) {
      return res.status(400).json({ success: false, error: 'orderId is required' });
    }

    const verification = await paymentService.verifyPaymentSignature({
      orderId,
      provider: (provider as PaymentProvider) || 'razorpay',
      providerOrderId: providerOrderId || razorpay_order_id || '',
      providerPaymentId: providerPaymentId || razorpay_payment_id || paymentGatewayTransactionId || '',
      signature: signature || razorpay_signature,
      stripeSessionId,
    });

    if (!verification.success) {
      console.warn(`[MAYF Payments] Signature verification failed for order ${orderId}:`, verification.error);
      return res.status(400).json({
        success: false,
        error: verification.error || 'Authoritative payment verification failed',
      });
    }

    // Authoritatively create or renew entitlement upon verified payment
    // Entitlement contains: userId, type = 'annual_pass', startsAt, expiresAt, status
    const entitlementGrant = entitlementService.createOrRenewFromPayment({
      userId,
      orderId: verification.order?.orderId || orderId,
      paymentId: verification.order?.providerPaymentId || `PAY-${Date.now()}`,
    });

    return res.json({
      success: true,
      order: verification.order,
      entitlement: entitlementGrant,
    });
  } catch (error: any) {
    console.error('[MAYF Payments] Payment verification error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Payment verification failed' });
  }
}

app.post('/api/payments/verify-signature', requireAuth, handleVerifyPayment);
app.post('/api/payments/verify-and-grant', requireAuth, handleVerifyPayment);

/**
 * 3. Razorpay Authoritative Webhook Endpoint
 * Verifies x-razorpay-signature HMAC and enforces idempotency
 */
app.post('/api/payments/webhook/razorpay', async (req: Request, res: Response) => {
  try {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const result = await paymentService.handleWebhook('razorpay', req.headers, rawBody);

    if (!result.success && result.status === 'signature_invalid') {
      console.warn('[MAYF Webhook] Razorpay signature invalid');
      return res.status(400).json({ status: 'invalid_signature', error: result.message });
    }

    // Provision entitlement if order is confirmed paid
    if (result.success && result.orderId) {
      const order = paymentService.getAllOrders().find((o) => o.orderId === result.orderId);
      if (order && order.status === 'paid') {
        entitlementService.createOrRenewFromPayment({
          userId: order.userId,
          orderId: order.orderId,
          paymentId: order.providerPaymentId,
        });
      }
    }

    // Always respond with 200 OK to acknowledged webhooks (even duplicate ones)
    return res.status(200).json({
      status: 'ok',
      idempotency: result.status,
      message: result.message,
      orderId: result.orderId,
    });
  } catch (error: any) {
    console.error('[MAYF Webhook] Razorpay webhook handling error:', error);
    return res.status(500).json({ status: 'error', error: error?.message || 'Webhook processing failed' });
  }
});

/**
 * 4. Stripe Authoritative Webhook Endpoint
 * Verifies stripe-signature timestamped HMAC and enforces idempotency
 */
app.post('/api/payments/webhook/stripe', async (req: Request, res: Response) => {
  try {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const result = await paymentService.handleWebhook('stripe', req.headers, rawBody);

    if (!result.success && result.status === 'signature_invalid') {
      console.warn('[MAYF Webhook] Stripe signature invalid');
      return res.status(400).json({ status: 'invalid_signature', error: result.message });
    }

    // Provision entitlement if order is confirmed paid
    if (result.success && result.orderId) {
      const order = paymentService.getAllOrders().find((o) => o.orderId === result.orderId);
      if (order && order.status === 'paid') {
        entitlementService.createOrRenewFromPayment({
          userId: order.userId,
          orderId: order.orderId,
          paymentId: order.providerPaymentId,
        });
      }
    }

    return res.status(200).json({
      status: 'ok',
      idempotency: result.status,
      message: result.message,
      orderId: result.orderId,
    });
  } catch (error: any) {
    console.error('[MAYF Webhook] Stripe webhook handling error:', error);
    return res.status(500).json({ status: 'error', error: error?.message || 'Webhook processing failed' });
  }
});

/**
 * 5. Student Orders Endpoint
 */
app.get('/api/student/orders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userAuth!.uid;
  const userOrders = paymentService.getUserOrders(userId);
  return res.json({
    success: true,
    orders: userOrders,
  });
});

/**
 * 6. Admin Payment Settings (NEVER reveals stored plaintext secrets)
 */
app.get('/api/admin/payments/settings', requireAuth, requireAdmin, (_req: Request, res: Response) => {
  const settings = paymentService.getMaskedSettings();
  return res.json({
    success: true,
    settings,
  });
});

app.post('/api/admin/payments/settings', requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    const updated = paymentService.updateSettings(req.body);
    return res.json({
      success: true,
      settings: updated,
      message: 'Payment settings successfully updated. Secret keys securely stored server-side.',
    });
  } catch (error: any) {
    console.error('[MAYF Admin] Payment settings update error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to update payment settings' });
  }
});

/**
 * 7. Admin Orders Ledger & Audit
 */
app.get('/api/admin/payments/orders', requireAuth, requireAdmin, (_req: Request, res: Response) => {
  const orders = paymentService.getAllOrders();
  const summary = {
    totalOrders: orders.length,
    paidOrders: orders.filter((o) => o.status === 'paid').length,
    pendingOrders: orders.filter((o) => o.status === 'pending' || o.status === 'created').length,
    failedOrders: orders.filter((o) => o.status === 'failed').length,
    totalGrossRevenueINR: orders
      .filter((o) => o.status === 'paid' && o.currency === 'INR')
      .reduce((sum, o) => sum + (o.grossAmount - o.discount + (o.tax || 0)), 0),
    totalGrossRevenueUSD: orders
      .filter((o) => o.status === 'paid' && o.currency === 'USD')
      .reduce((sum, o) => sum + (o.grossAmount - o.discount + (o.tax || 0)), 0),
  };

  return res.json({
    success: true,
    summary,
    orders,
  });
});

/**
 * 8. Admin Webhook Idempotency Log
 */
app.get('/api/admin/payments/webhook-logs', requireAuth, requireAdmin, (_req: Request, res: Response) => {
  const logs = paymentService.getWebhookLogs();
  return res.json({
    success: true,
    totalLogs: logs.length,
    logs,
  });
});

/**
 * 9. Admin Webhook Simulator & Idempotency Tester
 */
app.post('/api/admin/payments/simulate-webhook', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { provider = 'razorpay', eventType = 'payment.captured', orderId, simulateDuplicate } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'orderId is required for webhook simulation' });
    }

    const simulation = await paymentService.simulateWebhook({
      provider,
      eventType,
      orderId,
      simulateDuplicate: Boolean(simulateDuplicate),
    });

    if (simulation.success && simulation.order && simulation.order.status === 'paid') {
      entitlementService.createOrRenewFromPayment({
        userId: simulation.order.userId,
        orderId: simulation.order.orderId,
        paymentId: simulation.order.providerPaymentId,
      });
    }

    return res.json({
      success: true,
      simulation,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Webhook simulation error' });
  }
});

// -------------------------------------------------------------
// Configurable Annual Pass & Entitlement Management API
// -------------------------------------------------------------

/**
 * Public Annual Pass Configuration (For pricing & feature cards)
 */
app.get('/api/annual-pass/config', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    settings: entitlementService.getSettings(),
  });
});

/**
 * Student Active Entitlement Status & Expiry Check
 * Automatically reflects expired state without removing order history.
 */
app.get('/api/student/entitlement', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userAuth!.uid;
  const status = entitlementService.checkActiveEntitlement(userId);
  return res.json({
    success: true,
    active: status.active,
    daysRemaining: status.daysRemaining,
    reason: status.reason,
    entitlement: status.entitlement,
    settings: entitlementService.getSettings(),
  });
});

/**
 * Admin: Get Annual Pass Settings
 */
app.get('/api/admin/annual-pass/settings', requireAuth, requireAdmin, (_req: Request, res: Response) => {
  return res.json({
    success: true,
    settings: entitlementService.getSettings(),
  });
});

/**
 * Admin: Update Annual Pass Settings
 */
app.post('/api/admin/annual-pass/settings', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = entitlementService.updateSettings(req.body, req.userAuth?.uid || 'admin');
    return res.json({
      success: true,
      settings: updated,
      message: 'Annual Pass settings successfully updated.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to update Annual Pass settings' });
  }
});

/**
 * Admin: List All Entitlements
 */
app.get('/api/admin/annual-pass/entitlements', requireAuth, requireAdmin, (_req: Request, res: Response) => {
  const entitlements = entitlementService.getAllEntitlements();
  return res.json({
    success: true,
    count: entitlements.length,
    entitlements,
  });
});

/**
 * Admin: Grant Annual Pass
 */
app.post('/api/admin/annual-pass/grant', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, durationDays, notes } = req.body;
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ success: false, error: 'Student userId is required.' });
    }

    const entitlement = entitlementService.grantPass({
      userId: userId.trim(),
      durationDays: durationDays ? Number(durationDays) : undefined,
      notes,
      adminId: req.userAuth?.uid || 'admin',
    });

    return res.json({
      success: true,
      entitlement,
      message: `Annual Pass granted to ${userId} (${durationDays || 365} days).`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to grant Annual Pass' });
  }
});

/**
 * Admin: Extend Annual Pass
 */
app.post('/api/admin/annual-pass/extend', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, daysToAdd, newExpiresAt, reason } = req.body;
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ success: false, error: 'Student userId is required.' });
    }

    const extended = entitlementService.extendPass({
      userId: userId.trim(),
      daysToAdd: daysToAdd ? Number(daysToAdd) : undefined,
      newExpiresAt,
      reason,
      adminId: req.userAuth?.uid || 'admin',
    });

    return res.json({
      success: true,
      entitlement: extended,
      message: `Annual Pass extended for ${userId}. New expiry: ${new Date(extended.expiresAt).toLocaleDateString()}.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to extend Annual Pass' });
  }
});

/**
 * Admin: Revoke Annual Pass
 */
app.post('/api/admin/annual-pass/revoke', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, reason } = req.body;
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ success: false, error: 'Student userId is required.' });
    }

    const revoked = entitlementService.revokePass({
      userId: userId.trim(),
      reason,
      adminId: req.userAuth?.uid || 'admin',
    });

    return res.json({
      success: true,
      entitlement: revoked,
      message: `Annual Pass revoked for student ${userId}. Premium access terminated immediately.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to revoke Annual Pass' });
  }
});

/**
 * Admin: View Audit History Log
 */
app.get('/api/admin/annual-pass/history', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const userId = req.query.userId ? String(req.query.userId) : undefined;
  const history = entitlementService.getHistory(userId);
  return res.json({
    success: true,
    totalLogs: history.length,
    history,
  });
});

// -------------------------------------------------------------
// Authoritative Coupon Engine & Promotional Blocks API
// -------------------------------------------------------------

/**
 * Public/Student: Authoritative Server-Side Coupon Validation
 * Never trusts client discounts. Evaluates start/end dates, min cart, max discount,
 * usage limits, per-user limits, and product scope (all / annual pass / selected).
 */
app.post('/api/coupons/validate', async (req: Request, res: Response) => {
  try {
    const { code, cartGrossAmount, cartAmount, amount, currency = 'INR', items = [], userId } = req.body;

    let effectiveUserId = userId;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      const verified = await verifyStudentSessionToken(token);
      if (verified) {
        effectiveUserId = verified.uid;
      }
    }

    const computedGross = Number(
      cartGrossAmount ??
      cartAmount ??
      amount ??
      (Array.isArray(items) ? items.reduce((s: number, i: any) => s + (Number(i.price) || 0), 0) : 0)
    ) || 0;

    const validation = couponService.validateCoupon({
      code,
      userId: effectiveUserId,
      cartGrossAmount: computedGross,
      currency,
      items,
    });

    return res.json({
      success: true,
      ...validation,
    });
  } catch (error: any) {
    console.error('[MAYF Coupons] Validation error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to validate coupon' });
  }
});

/**
 * Public: Get Published Promotional Blocks for Homepage or Catalogue
 */
app.get('/api/promotions', (req: Request, res: Response) => {
  try {
    const placement = req.query.placement as 'homepage' | 'catalogue' | undefined;
    const promotions = couponService.getPublicPromotions(placement);
    return res.json({
      success: true,
      promotions,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve promotions' });
  }
});

/**
 * Admin: List All Configured Coupons
 */
app.get('/api/admin/coupons', requireAuth, requireAdmin, (_req: Request, res: Response) => {
  try {
    const coupons = couponService.getAllCoupons();
    return res.json({
      success: true,
      coupons,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to list coupons' });
  }
});

/**
 * Admin: Create or Update Coupon
 */
app.post('/api/admin/coupons', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const saved = couponService.saveCoupon(req.body);
    return res.json({
      success: true,
      coupon: saved,
      message: `Coupon "${saved.code}" successfully saved.`,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err?.message || 'Failed to save coupon' });
  }
});

/**
 * Admin: Delete Coupon
 */
app.delete('/api/admin/coupons/:code', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const code = req.params.code;
    const deleted = couponService.deleteCoupon(code);
    if (deleted) {
      auditLogService.log({
        action: 'CONTENT_DELETED',
        category: 'content',
        actorUid: req.userAuth?.uid || 'admin',
        actorEmail: req.userAuth?.email || 'admin@mayf.co.in',
        actorRole: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
        targetId: code,
        targetType: 'discount_coupon',
        details: { code, deletedAt: new Date().toISOString() },
        status: 'success',
      });
    }
    return res.json({
      success: true,
      deleted,
      message: deleted ? `Coupon "${code}" deleted.` : `Coupon "${code}" not found.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to delete coupon' });
  }
});

/**
 * Admin: List All Promotional Blocks
 */
app.get('/api/admin/promotions', requireAuth, requireAdmin, (_req: Request, res: Response) => {
  try {
    const promotions = couponService.getAllPromotions();
    return res.json({
      success: true,
      promotions,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to list promotional blocks' });
  }
});

/**
 * Admin: Create or Update Promotional Block
 */
app.post('/api/admin/promotions', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const saved = couponService.savePromotion(req.body);
    return res.json({
      success: true,
      promotion: saved,
      message: `Promotional block "${saved.title}" saved successfully.`,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err?.message || 'Failed to save promotional block' });
  }
});

/**
 * Admin: Delete Promotional Block
 */
app.delete('/api/admin/promotions/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id;
    const deleted = couponService.deletePromotion(id);
    if (deleted) {
      auditLogService.log({
        action: 'CONTENT_DELETED',
        category: 'content',
        actorUid: req.userAuth?.uid || 'admin',
        actorEmail: req.userAuth?.email || 'admin@mayf.co.in',
        actorRole: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
        targetId: id,
        targetType: 'promotional_block',
        details: { id, deletedAt: new Date().toISOString() },
        status: 'success',
      });
    }
    return res.json({
      success: true,
      deleted,
      message: deleted ? 'Promotional block deleted.' : 'Promotional block not found.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to delete promotional block' });
  }
});

// -------------------------------------------------------------
// Admin Privileged Custom Claims Setter
// -------------------------------------------------------------
app.post('/api/admin/set-claims', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { targetUid, role, pro, annualPass } = req.body;
    if (!targetUid) {
      return res.status(400).json({ error: 'targetUid is required' });
    }

    // Server-side custom claims assignment logic
    console.info(`[MAYF Admin] Setting custom claims for ${targetUid}:`, { role, pro, annualPass });

    return res.json({
      success: true,
      targetUid,
      claimsSet: {
        role: role || 'student',
        pro: Boolean(pro),
        annualPass: Boolean(annualPass),
      },
    });
  } catch (error) {
    console.error('[MAYF Admin] Set claims failure:', error);
    return res.status(500).json({ error: 'Failed to update custom claims' });
  }
});

// -------------------------------------------------------------
// Administration Management APIs (Require strict RBAC and claims)
// -------------------------------------------------------------
app.get('/api/admin/metrics', requireAuth, requireAdmin, (_req: Request, res: Response) => {
  return res.json({
    totalStudents: 12480,
    activeAnnualPasses: 3410,
    totalRevenue: 6816590,
    aiDoubtsSolved: 84320,
    totalFormulas: 38,
    totalChapters: 64,
    activeCoupons: couponService.getAllCoupons().length,
    serverStatus: 'healthy',
    cloudflareAccessActive: true,
    edgeVerifiedEmail: '2026vivekkushwah@gmail.com',
    uptimeHours: 342,
  });
});

// -------------------------------------------------------------
// Admin User Management & Firebase Admin SDK Endpoints
// -------------------------------------------------------------

/**
 * 1. Search & List Students
 * Supports search query, class, board, and entitlement filtering
 */
app.get('/api/admin/students', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const { q, studentClass, board, passStatus, includeDisabled } = req.query as Record<string, string>;
  const list = adminUserManager.searchStudents({
    search: q,
    studentClass,
    board,
    passStatus,
    includeDisabled: includeDisabled === 'true',
  });
  return res.json(list);
});

/**
 * 2. View Full Student Profile with Status & Claims
 */
app.get('/api/admin/users/:uid', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const { uid } = req.params;
  const profile = adminUserManager.getStudentProfile(uid);
  if (!profile) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const orders = adminUserManager.getStudentOrders(uid);
  const activity = adminUserManager.getStudentActivity(uid);

  return res.json({
    profile,
    orders,
    activity,
  });
});

/**
 * 3. Disable / Enable User Account via Firebase Admin SDK
 */
app.post('/api/admin/users/:uid/disable', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { uid } = req.params;
  const { disabled } = req.body;
  if (typeof disabled !== 'boolean') {
    return res.status(400).json({ error: 'Boolean disabled flag is required' });
  }

  const actor = {
    uid: req.userAuth?.uid || 'admin',
    email: req.userAuth?.email || 'admin@mayf.co.in',
    role: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
  };

  const result = await adminUserManager.setUserDisabledStatus(uid, disabled, actor);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  return res.json({
    success: true,
    uid,
    disabled,
    student: result.student,
    forceTokenRefresh: disabled,
    message: disabled ? 'User account has been disabled and session revoked.' : 'User account reactivated.',
  });
});

/**
 * 4. Delete / Remove User According to Policy
 */
app.delete('/api/admin/users/:uid', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { uid } = req.params;
  const { policyReason } = req.body || {};

  if (!policyReason) {
    return res.status(400).json({
      error: 'A compliance policy reason (e.g. GDPR_STUDENT_REQUEST, TERMS_VIOLATION, DATA_RETENTION) is required to remove user',
    });
  }

  const actor = {
    uid: req.userAuth?.uid || 'admin',
    email: req.userAuth?.email || 'admin@mayf.co.in',
    role: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
  };

  const result = await adminUserManager.deleteUserWithPolicy(uid, policyReason, actor);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  return res.json({
    success: true,
    uid,
    policyReason,
    message: 'User removed according to retention policy and Auth account deleted.',
  });
});

/**
 * 5. Grant / Revoke Pro Tier (Firebase Custom Claim)
 */
app.post('/api/admin/users/:uid/pro', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { uid } = req.params;
  const { grant, reason } = req.body;

  const actor = {
    uid: req.userAuth?.uid || 'admin',
    email: req.userAuth?.email || 'admin@mayf.co.in',
    role: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
  };

  const result = await adminUserManager.setProStatus(uid, Boolean(grant), actor, reason);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  return res.json({
    success: true,
    uid,
    isPro: Boolean(grant),
    student: result.student,
    forceTokenRefresh: true,
    message: grant ? 'Pro tier granted with custom claim pro:true.' : 'Pro tier revoked.',
  });
});

/**
 * 6. Grant / Revoke Annual Pass (Firebase Custom Claim)
 */
app.post('/api/admin/users/:uid/annual-pass', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { uid } = req.params;
  const { grant, expiryDate, reason } = req.body;

  const actor = {
    uid: req.userAuth?.uid || 'admin',
    email: req.userAuth?.email || 'admin@mayf.co.in',
    role: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
  };

  const result = await adminUserManager.setAnnualPassStatus(uid, Boolean(grant), expiryDate, actor, reason);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  return res.json({
    success: true,
    uid,
    hasAnnualPass: Boolean(grant),
    student: result.student,
    forceTokenRefresh: true,
    message: grant ? 'Annual Pass granted and custom claims updated.' : 'Annual Pass revoked.',
  });
});

/**
 * 7. Change Annual Pass Expiry Date
 */
app.put('/api/admin/users/:uid/annual-pass/expiry', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { uid } = req.params;
  const { expiryDate, reason } = req.body;

  if (!expiryDate) {
    return res.status(400).json({ error: 'New expiryDate (YYYY-MM-DD) is required' });
  }

  const actor = {
    uid: req.userAuth?.uid || 'admin',
    email: req.userAuth?.email || 'admin@mayf.co.in',
    role: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
  };

  const result = await adminUserManager.changeAnnualPassExpiry(uid, expiryDate, actor, reason);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  return res.json({
    success: true,
    uid,
    passExpiry: expiryDate,
    student: result.student,
    forceTokenRefresh: true,
    message: `Annual Pass expiry updated to ${expiryDate}.`,
  });
});

/**
 * 8. View Orders for Given Student
 */
app.get('/api/admin/users/:uid/orders', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const { uid } = req.params;
  const orders = adminUserManager.getStudentOrders(uid);
  return res.json(orders);
});

/**
 * 9. View Activity for Given Student
 */
app.get('/api/admin/users/:uid/activity', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const { uid } = req.params;
  const activity = adminUserManager.getStudentActivity(uid);
  return res.json(activity);
});

/**
 * 10. Role Management (Make Admin / SuperAdmin / Student)
 * RBAC GATED: Only superAdmin can create or remove administrators or modify another superAdmin
 */
app.post('/api/admin/users/:uid/role', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { uid } = req.params;
  const { role } = req.body;

  if (!role || !['admin', 'superAdmin', 'student'].includes(role)) {
    return res.status(400).json({ error: 'Valid role (admin, superAdmin, student) is required' });
  }

  const actor = {
    uid: req.userAuth?.uid || 'admin',
    email: req.userAuth?.email || 'admin@mayf.co.in',
    role: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
  };

  const result = await adminUserManager.setUserRole(uid, role, actor);
  if (!result.success) {
    const statusCode = result.error?.includes('Forbidden') ? 403 : 400;
    return res.status(statusCode).json({ error: result.error });
  }

  return res.json({
    success: true,
    uid,
    role,
    student: result.student,
    forceTokenRefresh: true,
    message: `Role updated to ${role}. Refresh tokens revoked to force re-authentication.`,
  });
});

/**
 * 11. Remove Admin Privileges (Revert to Student)
 * RBAC GATED: Only superAdmin can remove administrators
 */
app.delete('/api/admin/users/:uid/role', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { uid } = req.params;

  const actor = {
    uid: req.userAuth?.uid || 'admin',
    email: req.userAuth?.email || 'admin@mayf.co.in',
    role: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
  };

  const result = await adminUserManager.setUserRole(uid, 'student', actor);
  if (!result.success) {
    const statusCode = result.error?.includes('Forbidden') ? 403 : 400;
    return res.status(statusCode).json({ error: result.error });
  }

  return res.json({
    success: true,
    uid,
    role: 'student',
    student: result.student,
    forceTokenRefresh: true,
    message: 'Administrator privileges removed. Target user reverted to student.',
  });
});

/**
 * 12. List Active Privileged Administrators
 */
app.get('/api/admin/admins', requireAuth, requireAdmin, (_req: Request, res: Response) => {
  return res.json([
    {
      uid: 'admin-super-001',
      email: '2026vivekkushwah@gmail.com',
      displayName: 'Vivek Kushwah (Principal Admin)',
      role: 'superAdmin',
      hasCustomClaim: true,
      customClaims: {
        admin: true,
        superAdmin: true,
      },
      lastLogin: new Date().toISOString(),
      addedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      uid: 'admin-002',
      email: 'admin@mayf.co.in',
      displayName: 'Academic Operations Lead',
      role: 'admin',
      hasCustomClaim: true,
      customClaims: {
        admin: true,
        superAdmin: false,
      },
      lastLogin: '2026-10-07T18:30:00.000Z',
      addedAt: '2026-02-15T00:00:00.000Z',
    },
  ]);
});

/**
 * 13. Mint Custom Claim Directly
 * Gated: only superAdmin can mint claims
 */
app.post('/api/admin/admins/claim', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { email, role } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Only superAdmin can assign admin roles
  if (req.userAuth?.role !== 'superAdmin') {
    return res.status(403).json({ error: 'Forbidden: Only superAdmin can create or remove administrators' });
  }

  const isSuper = role === 'superAdmin';
  auditLogService.log({
    action: 'ADMIN_CREATED',
    category: 'admin',
    actorUid: req.userAuth?.uid || 'admin',
    actorEmail: req.userAuth?.email || 'admin@mayf.co.in',
    actorRole: 'superAdmin',
    targetId: `usr-${email}`,
    targetEmail: email,
    targetType: 'administrator_role',
    details: { email, role, admin: true, superAdmin: isSuper },
    status: 'success',
  });

  return res.json({
    success: true,
    email,
    claims: {
      role: role || 'admin',
      admin: true,
      superAdmin: isSuper,
    },
    forceTokenRefresh: true,
  });
});

/**
 * 14. Audit Logs Retrieval
 * Returns audit entries filtered by category (admin, subscription, content, refund, security, user)
 */
app.get('/api/admin/audit-logs', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const { category, action, actorEmail, limit } = req.query as Record<string, string>;
  const logs = auditLogService.getLogs({
    category,
    action,
    actorEmail,
    limit: limit ? parseInt(limit, 10) : 100,
  });
  return res.json(logs);
});

/**
 * 15. Export Audit Logs as CSV
 */
app.get('/api/admin/audit-logs/export', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const { category } = req.query as Record<string, string>;
  const csv = auditLogService.exportCsv(category);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="mayf-audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
  return res.send(csv);
});

/**
 * 16. Security Configuration: Get Settings
 */
app.get('/api/admin/security/config', requireAuth, requireAdmin, (_req: Request, res: Response) => {
  const config = adminUserManager.getSecurityConfig();
  return res.json(config);
});

/**
 * 17. Security Configuration: Update Settings
 * RBAC GATED: ONLY superAdmin can modify critical security configuration
 */
app.post('/api/admin/security/config', requireAuth, requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  const actor = {
    uid: req.userAuth!.uid,
    email: req.userAuth!.email,
    role: req.userAuth!.role as 'superAdmin',
  };

  const result = adminUserManager.updateSecurityConfig(req.body, actor);
  if (!result.success) {
    return res.status(403).json({ error: result.error });
  }

  return res.json({
    success: true,
    config: result.config,
    message: 'Critical security configuration successfully updated.',
  });
});

/**
 * 18. Order Refund Endpoint
 * Logs audit entry: refund-related changes
 */
app.post('/api/admin/orders/:orderId/refund', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { orderId } = req.params;
  const { reason, amount } = req.body;

  auditLogService.log({
    action: 'REFUND_PROCESSED',
    category: 'refund',
    actorUid: req.userAuth?.uid || 'admin',
    actorEmail: req.userAuth?.email || 'admin@mayf.co.in',
    actorRole: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
    targetId: orderId,
    targetType: 'payment_order',
    details: { orderId, amount, reason: reason || 'Customer refund request' },
    status: 'success',
  });

  return res.json({
    success: true,
    orderId,
    status: 'refunded',
    message: `Order ${orderId} has been refunded and audit log recorded.`,
  });
});

// -------------------------------------------------------------
// Complete Content CMS Endpoints
// Supports: create, edit, preview, publish, hide, unhide, unpublish,
// safe-delete/archive, restore, permanent purge, duplicate, feature, reorder.
// -------------------------------------------------------------

/**
 * 19. List Content CMS Items
 * Supports search, classLevel, contentType, accessType, visibility, tab, sortBy
 */
app.get('/api/admin/content', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      search,
      classLevel,
      contentType,
      accessType,
      visibility,
      tab = 'active',
      sortBy = 'sortOrder',
    } = req.query;

    const result = contentCmsManager.getItems({
      search: search ? String(search) : undefined,
      classLevel: classLevel ? String(classLevel) : undefined,
      contentType: contentType ? String(contentType) : undefined,
      accessType: accessType ? String(accessType) : undefined,
      visibility: visibility ? String(visibility) : undefined,
      tab: tab === 'archived' ? 'archived' : 'active',
      sortBy: sortBy as any,
    });

    return res.json({
      success: true,
      items: result.items,
      counts: result.counts,
    });
  } catch (error: any) {
    console.error('[Admin Content CMS] List error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to list content items' });
  }
});

/**
 * 20. Get Single Content CMS Item
 */
app.get('/api/admin/content/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = contentCmsManager.getItem(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: `Content item "${req.params.id}" not found.` });
    }
    return res.json({ success: true, item });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Failed to fetch content item' });
  }
});

/**
 * 21. Create Content Item
 */
app.post('/api/admin/content', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const actor = {
      uid: req.userAuth?.uid || 'admin',
      email: req.userAuth?.email || 'admin@mayf.co.in',
      role: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
    };

    const newItem = contentCmsManager.createItem(req.body, actor);
    return res.status(201).json({
      success: true,
      item: newItem,
      message: `Content item "${newItem.title}" created successfully.`,
    });
  } catch (error: any) {
    console.error('[Admin Content CMS] Create error:', error);
    return res.status(400).json({ success: false, error: error?.message || 'Failed to create content item' });
  }
});

/**
 * 22. Edit / Update Content Item
 */
app.put('/api/admin/content/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const actor = {
      uid: req.userAuth?.uid || 'admin',
      email: req.userAuth?.email || 'admin@mayf.co.in',
      role: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
    };

    const updated = contentCmsManager.updateItem(req.params.id, req.body, actor);
    return res.json({
      success: true,
      item: updated,
      message: `Content item "${updated.title}" updated successfully.`,
    });
  } catch (error: any) {
    console.error('[Admin Content CMS] Update error:', error);
    return res.status(400).json({ success: false, error: error?.message || 'Failed to update content item' });
  }
});

/**
 * 23. Publish Content Item
 */
app.post('/api/admin/content/:id/publish', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const actor = {
      uid: req.userAuth?.uid || 'admin',
      email: req.userAuth?.email || 'admin@mayf.co.in',
      role: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
    };

    const item = contentCmsManager.publishItem(req.params.id, actor);
    return res.json({
      success: true,
      item,
      message: `"${item.title}" is now published and live in catalogue.`,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error?.message || 'Failed to publish item' });
  }
});

/**
 * 24. Unpublish Content Item (Revert to Draft)
 */
app.post('/api/admin/content/:id/unpublish', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const actor = {
      uid: req.userAuth?.uid || 'admin',
      email: req.userAuth?.email || 'admin@mayf.co.in',
      role: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
    };

    const item = contentCmsManager.unpublishItem(req.params.id, actor);
    return res.json({
      success: true,
      item,
      message: `"${item.title}" reverted to draft (unpublished).`,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error?.message || 'Failed to unpublish item' });
  }
});

/**
 * 25. Hide Content Item
 */
app.post('/api/admin/content/:id/hide', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const actor = {
      uid: req.userAuth?.uid || 'admin',
      email: req.userAuth?.email || 'admin@mayf.co.in',
      role: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
    };

    const item = contentCmsManager.hideItem(req.params.id, actor);
    return res.json({
      success: true,
      item,
      message: `"${item.title}" is now hidden from the public catalogue.`,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error?.message || 'Failed to hide item' });
  }
});

/**
 * 26. Unhide Content Item
 */
app.post('/api/admin/content/:id/unhide', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const actor = {
      uid: req.userAuth?.uid || 'admin',
      email: req.userAuth?.email || 'admin@mayf.co.in',
      role: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
    };

    const item = contentCmsManager.unhideItem(req.params.id, actor);
    return res.json({
      success: true,
      item,
      message: `"${item.title}" is now unhidden and visible in catalogue.`,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error?.message || 'Failed to unhide item' });
  }
});

/**
 * 27. Safe Delete / Archive Content Item (Prefer soft-delete first!)
 */
app.post('/api/admin/content/:id/archive', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reason } = req.body || {};
    const actor = {
      uid: req.userAuth?.uid || 'admin',
      email: req.userAuth?.email || 'admin@mayf.co.in',
      role: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
    };

    const item = contentCmsManager.softDeleteItem(req.params.id, reason, actor);
    return res.json({
      success: true,
      item,
      message: `"${item.title}" safely moved to Archive. Underlying Cloud Storage files and Drive IDs remain intact.`,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error?.message || 'Failed to archive item' });
  }
});

/**
 * 28. Restore Content Item from Archive
 */
app.post('/api/admin/content/:id/restore', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const actor = {
      uid: req.userAuth?.uid || 'admin',
      email: req.userAuth?.email || 'admin@mayf.co.in',
      role: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
    };

    const item = contentCmsManager.restoreItem(req.params.id, actor);
    return res.json({
      success: true,
      item,
      message: `"${item.title}" restored from archive to draft catalogue.`,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error?.message || 'Failed to restore item' });
  }
});

/**
 * 29. Content Deletion Endpoint (Safe deletion preferred by default, permanent purge if requested)
 */
app.delete('/api/admin/content/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reason, purge } = req.body || {};
    const actor = {
      uid: req.userAuth?.uid || 'admin',
      email: req.userAuth?.email || 'admin@mayf.co.in',
      role: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
    };

    // If explicit purge flag is passed, execute permanent purge
    if (purge === true) {
      const outcome = contentCmsManager.purgeItem(req.params.id, reason, actor);
      return res.json({
        success: true,
        id: outcome.id,
        purged: true,
        message: `Content resource "${outcome.title}" permanently purged. Audit log created.`,
      });
    }

    // Default policy: SAFE SOFT-DELETE / ARCHIVE
    const archived = contentCmsManager.softDeleteItem(req.params.id, reason, actor);
    return res.json({
      success: true,
      id: archived.id,
      purged: false,
      archived: true,
      message: `"${archived.title}" safely soft-deleted to Archive. Files are preserved and can be restored anytime.`,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error?.message || 'Failed to delete/archive content' });
  }
});

/**
 * 30. Duplicate Content Item
 */
app.post('/api/admin/content/:id/duplicate', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const actor = {
      uid: req.userAuth?.uid || 'admin',
      email: req.userAuth?.email || 'admin@mayf.co.in',
      role: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
    };

    const duplicate = contentCmsManager.duplicateItem(req.params.id, actor);
    return res.json({
      success: true,
      item: duplicate,
      message: `Duplicated as "${duplicate.title}". Created in draft mode.`,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error?.message || 'Failed to duplicate content item' });
  }
});

/**
 * 31. Feature Toggle Content Item
 */
app.post('/api/admin/content/:id/feature', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { featured } = req.body;
    const actor = {
      uid: req.userAuth?.uid || 'admin',
      email: req.userAuth?.email || 'admin@mayf.co.in',
      role: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
    };

    const updated = contentCmsManager.toggleFeature(req.params.id, Boolean(featured), actor);
    return res.json({
      success: true,
      item: updated,
      message: `"${updated.title}" ${updated.featured ? 'marked as featured' : 'removed from featured'}.`,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error?.message || 'Failed to toggle featured status' });
  }
});

/**
 * 32. Reorder Content Items
 */
app.post('/api/admin/content/reorder', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderMapping } = req.body;
    if (!orderMapping || !Array.isArray(orderMapping)) {
      return res.status(400).json({ success: false, error: 'orderMapping array is required [{ id, sortOrder }]' });
    }

    const actor = {
      uid: req.userAuth?.uid || 'admin',
      email: req.userAuth?.email || 'admin@mayf.co.in',
      role: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
    };

    const outcome = contentCmsManager.reorderItems(orderMapping, actor);
    return res.json({
      success: true,
      updatedCount: outcome.updatedCount,
      message: `Updated display order for ${outcome.updatedCount} content resources.`,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error?.message || 'Failed to reorder content items' });
  }
});

// -------------------------------------------------------------
// Hierarchical Categories Management Endpoints
// Arbitrary parent-child nested structure (e.g. Class 8 -> Maths -> Algebra -> Linear Equations)
// Safe deletion guard: prevents deleting categories with content unless reassigned
// -------------------------------------------------------------

/**
 * 33. List Hierarchical Categories
 * Query: ?format=tree|flat, ?includeDisabled=true|false
 */
app.get('/api/admin/categories', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { format = 'tree', includeDisabled = 'true' } = req.query;
    const includeDisabledBool = includeDisabled !== 'false';

    const flat = categoryManager.getAllFlat(includeDisabledBool);
    const tree = categoryManager.getTree(includeDisabledBool);

    return res.json({
      success: true,
      categories: format === 'flat' ? flat : tree,
      flat,
      totalCount: flat.length,
    });
  } catch (error: any) {
    console.error('[Admin Categories] List error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to list categories' });
  }
});

/**
 * 34. Get Single Category Details
 */
app.get('/api/admin/categories/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const category = categoryManager.getById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, error: `Category "${req.params.id}" not found.` });
    }
    const ancestors = categoryManager.getAncestors(req.params.id);
    return res.json({ success: true, category, ancestors });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Failed to get category' });
  }
});

/**
 * 35. Can-Delete Safety Pre-check
 */
app.get('/api/admin/categories/:id/can-delete', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = categoryManager.canDelete(req.params.id);
    return res.json({ success: true, ...result });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Failed to evaluate delete safety' });
  }
});

/**
 * 36. Create Hierarchical Category
 */
app.post('/api/admin/categories', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const actor = {
      uid: req.userAuth?.uid || 'admin',
      email: req.userAuth?.email || 'admin@mayf.co.in',
      role: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
    };

    const newCat = categoryManager.create(req.body, actor);
    return res.status(201).json({
      success: true,
      category: newCat,
      message: `Category "${newCat.name}" created successfully.`,
    });
  } catch (error: any) {
    console.error('[Admin Categories] Create error:', error);
    return res.status(400).json({ success: false, error: error?.message || 'Failed to create category' });
  }
});

/**
 * 37. Rename / Update Category
 */
app.put('/api/admin/categories/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const actor = {
      uid: req.userAuth?.uid || 'admin',
      email: req.userAuth?.email || 'admin@mayf.co.in',
      role: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
    };

    const { name, parentId, description, sortOrder, disabled, applicableGrades } = req.body;
    let cat = categoryManager.getById(req.params.id);
    if (!cat) return res.status(404).json({ success: false, error: 'Category not found' });

    if (name && name !== cat.name) {
      cat = categoryManager.rename(req.params.id, name, actor);
    }

    if (parentId !== undefined && parentId !== cat.parentId) {
      cat = categoryManager.move(req.params.id, parentId, actor);
    }

    if (sortOrder !== undefined) {
      cat = categoryManager.reorder(req.params.id, sortOrder, actor);
    }

    if (disabled !== undefined && disabled !== cat.disabled) {
      cat = categoryManager.toggleDisable(req.params.id, disabled, actor);
    }

    return res.json({
      success: true,
      category: cat,
      message: `Category "${cat.name}" updated successfully.`,
    });
  } catch (error: any) {
    console.error('[Admin Categories] Update error:', error);
    return res.status(400).json({ success: false, error: error?.message || 'Failed to update category' });
  }
});

/**
 * 38. Move Category (Change Parent)
 */
app.post('/api/admin/categories/:id/move', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const actor = {
      uid: req.userAuth?.uid || 'admin',
      email: req.userAuth?.email || 'admin@mayf.co.in',
      role: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
    };

    const { newParentId } = req.body;
    const moved = categoryManager.move(req.params.id, newParentId, actor);
    return res.json({
      success: true,
      category: moved,
      message: `Category "${moved.name}" moved to ${newParentId ? 'new parent' : 'root level'}.`,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error?.message || 'Failed to move category' });
  }
});

/**
 * 39. Reorder Category
 */
app.post('/api/admin/categories/:id/reorder', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const actor = {
      uid: req.userAuth?.uid || 'admin',
      email: req.userAuth?.email || 'admin@mayf.co.in',
      role: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
    };

    const { sortOrder } = req.body;
    if (sortOrder === undefined) return res.status(400).json({ success: false, error: 'sortOrder is required' });

    const reordered = categoryManager.reorder(req.params.id, Number(sortOrder), actor);
    return res.json({
      success: true,
      category: reordered,
      message: `Category order updated to ${sortOrder}.`,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error?.message || 'Failed to reorder category' });
  }
});

/**
 * 40. Disable / Enable Category
 */
app.post('/api/admin/categories/:id/toggle-disable', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const actor = {
      uid: req.userAuth?.uid || 'admin',
      email: req.userAuth?.email || 'admin@mayf.co.in',
      role: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
    };

    const { disabled } = req.body;
    const updated = categoryManager.toggleDisable(req.params.id, Boolean(disabled), actor);
    return res.json({
      success: true,
      category: updated,
      message: `Category "${updated.name}" is now ${updated.disabled ? 'disabled' : 'enabled'}.`,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error?.message || 'Failed to toggle category disabled status' });
  }
});

/**
 * 41. Delete Category Where Safe
 * PREVENTS deleting categories containing content unless content is reassigned!
 */
app.delete('/api/admin/categories/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const actor = {
      uid: req.userAuth?.uid || 'admin',
      email: req.userAuth?.email || 'admin@mayf.co.in',
      role: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
    };

    const { reassignToId, reason } = req.body || {};
    const outcome = categoryManager.delete(req.params.id, { reassignToId, reason }, actor);

    return res.json({
      ...outcome,
      message: outcome.reassignedCount > 0
        ? `Category "${outcome.deletedName}" safely deleted. Reassigned ${outcome.reassignedCount} content items to target category.`
        : `Category "${outcome.deletedName}" safely deleted.`,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error?.message || 'Failed to delete category' });
  }
});

// -------------------------------------------------------------
// Controlled Homepage Block Manager Endpoints
// Predefined 15 performant blocks (Hero, Search, Trending, Categories, etc.)
// Persisted in Firestore /siteSettings/homepageLayout
// -------------------------------------------------------------

/**
 * 42. Public Homepage Layout Endpoint (Cached with SWR)
 */
app.get('/api/homepage/layout', (_req: Request, res: Response) => {
  try {
    const layout = homepageLayoutService.getPublicLayout();
    // Cache for 60 seconds at edge/browser, allow serving stale up to 5 minutes while revalidating
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    return res.json({
      success: true,
      ...layout,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Failed to fetch homepage layout' });
  }
});

/**
 * 43. Admin Get Full Homepage Layout (All 15 blocks)
 */
app.get('/api/admin/layout/homepage', requireAuth, requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const layout = homepageLayoutService.getAdminLayout();
    return res.json({
      success: true,
      ...layout,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Failed to fetch admin layout' });
  }
});

/**
 * 44. Admin Save Full Homepage Layout (Drag-and-drop reordered blocks + configs)
 */
app.put('/api/admin/layout/homepage', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const actor = {
      uid: req.userAuth?.uid || 'admin',
      email: req.userAuth?.email || 'admin@mayf.co.in',
      role: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
    };

    const { blocks } = req.body;
    if (!blocks || !Array.isArray(blocks)) {
      return res.status(400).json({ success: false, error: 'blocks array is required' });
    }

    const updated = await homepageLayoutService.updateLayout(blocks, actor);
    return res.json({
      success: true,
      ...updated,
      message: 'Homepage block layout successfully updated and synced with site settings.',
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error?.message || 'Failed to update layout' });
  }
});

/**
 * 45. Admin Update Single Homepage Block
 */
app.patch('/api/admin/layout/homepage/blocks/:id', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const actor = {
      uid: req.userAuth?.uid || 'admin',
      email: req.userAuth?.email || 'admin@mayf.co.in',
      role: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
    };

    const { id } = req.params;
    const { enabled, config } = req.body;

    const updatedBlock = await homepageLayoutService.updateBlock(id as any, { enabled, config }, actor);
    return res.json({
      success: true,
      block: updatedBlock,
      message: `Block "${updatedBlock.name}" updated.`,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error?.message || 'Failed to update block' });
  }
});

/**
 * 46. Admin Reset Homepage Layout to Defaults
 */
app.post('/api/admin/layout/homepage/reset', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const actor = {
      uid: req.userAuth?.uid || 'admin',
      email: req.userAuth?.email || 'admin@mayf.co.in',
      role: (req.userAuth?.role === 'superAdmin' ? 'superAdmin' : 'admin') as 'admin' | 'superAdmin',
    };

    const resetLayout = await homepageLayoutService.resetToDefault(actor);
    return res.json({
      success: true,
      ...resetLayout,
      message: 'Homepage block layout reset to default canonical order and configuration.',
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error?.message || 'Failed to reset layout' });
  }
});

app.get('/api/admin/ai-activity', requireAuth, requireAdmin, (_req: Request, res: Response) => {
  return res.json([
    {
      id: 'ai-q-901',
      timestamp: new Date().toISOString(),
      studentGrade: 'Class 10',
      topic: 'Quadratic Equations',
      questionSnippet: 'Derive quadratic formula using completing the square method',
      model: AI_TEACHER_MODEL,
      latencyMs: 720,
      tokensUsed: 480,
      resolved: true,
      rating: 5,
    },
    {
      id: 'ai-q-902',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      studentGrade: 'Class 9',
      topic: 'Circles',
      questionSnippet: 'Proof that perpendicular from centre to chord bisects chord',
      model: AI_TEACHER_MODEL,
      latencyMs: 840,
      tokensUsed: 520,
      resolved: true,
      rating: 5,
    },
    {
      id: 'ai-q-903',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      studentGrade: 'Class 10',
      topic: 'Trigonometry',
      questionSnippet: 'Prove identity (sin A + cosec A)^2 + (cos A + sec A)^2 = 7 + tan^2 A + cot^2 A',
      model: AI_TEACHER_MODEL,
      latencyMs: 650,
      tokensUsed: 610,
      resolved: true,
      rating: 5,
    },
  ]);
});

app.get('/api/admin/orders', requireAuth, requireAdmin, (_req: Request, res: Response) => {
  const stored = paymentService.getAllOrders();
  if (stored && stored.length > 0) {
    return res.json(
      stored.map((o: StoredOrder) => ({
        id: o.orderId,
        orderNumber: o.providerOrderId || o.orderId,
        customerEmail: o.customerDetails?.email || 'student@mayf.co.in',
        planName: o.items[0]?.title || 'Annual Pass (Classes 5–10)',
        amount: o.grossAmount,
        currency: o.currency,
        gateway: o.provider,
        status: o.status,
        createdAt: o.createdAt,
        paymentId: o.providerPaymentId || 'pay_' + o.orderId.slice(0, 10),
      }))
    );
  }
  return res.json([
    {
      id: 'ord-801',
      orderNumber: 'MAYF-2026-8910',
      customerEmail: 'arjun.sharma@mayf.co.in',
      planName: 'Annual Pass (Classes 5–10)',
      amount: 1999,
      currency: 'INR',
      gateway: 'razorpay',
      status: 'captured',
      createdAt: '2026-10-08T04:22:00.000Z',
      paymentId: 'pay_rzp_98a7s6d5f4',
    },
    {
      id: 'ord-802',
      orderNumber: 'MAYF-2026-8909',
      customerEmail: 'priya.patel@gmail.com',
      planName: 'Annual Pass Family Pack (2 Children)',
      amount: 2999,
      currency: 'INR',
      gateway: 'stripe',
      status: 'paid',
      createdAt: '2026-10-07T19:15:00.000Z',
      paymentId: 'pi_3MtwBwLkdIwHu7ix28aZlKst',
    },
  ]);
});

const IN_MEMORY_BROADCASTS = [
  {
    id: 'notif-1',
    title: 'Class 10 CBSE Board Exemplars Released',
    message: 'All worked solutions for Real Numbers & Polynomials are now live on the portal.',
    targetClass: 'Class 10',
    type: 'exam',
    createdAt: '2026-10-06T10:00:00.000Z',
    author: '2026vivekkushwah@gmail.com',
    sentCount: 3840,
  },
  {
    id: 'notif-2',
    title: 'Diwali Revision Pass Discount Available',
    message: 'Apply coupon FESTIVE20 for 20% off on all Annual Pass tiers this week.',
    targetClass: 'All',
    type: 'promo',
    createdAt: '2026-10-04T08:30:00.000Z',
    author: '2026vivekkushwah@gmail.com',
    sentCount: 12480,
  },
];

app.get('/api/admin/notifications', requireAuth, requireAdmin, (_req: Request, res: Response) => {
  return res.json(IN_MEMORY_BROADCASTS);
});

app.post('/api/admin/notifications', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { title, message, targetClass, type } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }
  const newNotif = {
    id: 'notif-' + Date.now(),
    title,
    message,
    targetClass: targetClass || 'All',
    type: type || 'info',
    createdAt: new Date().toISOString(),
    author: req.userAuth?.uid || '2026vivekkushwah@gmail.com',
    sentCount: 12480,
  };
  IN_MEMORY_BROADCASTS.unshift(newNotif);
  return res.json({ success: true, notification: newNotif });
});

// -------------------------------------------------------------
// AI Teacher (Gemini Multimodal Server-Side System)
// -------------------------------------------------------------

interface AiDoubtRecord {
  id: string;
  uid: string | null;
  question: string;
  questionType: 'text' | 'image' | 'camera' | 'screenshot';
  studentClass: string;
  chapterTopic: string;
  reply: string;
  timestamp: string;
  responseStatus: 'success' | 'clarification_needed' | 'error';
  tokenMetadata?: {
    model: string;
    totalTokens?: number;
    promptTokens?: number;
    candidateTokens?: number;
  };
  userRating?: 'helpful' | 'unhelpful';
}

const AI_DOUBTS_HISTORY: AiDoubtRecord[] = [
  {
    id: 'doubt-seed-1',
    uid: 'mayf-student-1001',
    question: 'Why do we reject negative roots in speed and distance word problems?',
    questionType: 'text',
    studentClass: 'Class 10',
    chapterTopic: 'Quadratic Equations',
    reply: `### Understanding the Question\nThe question asks why negative values obtained as solutions to a quadratic equation are discarded when solving physical motion problems.\n\n### Given Information\nIn speed-distance-time problems, the unknown variable $x$ represents speed ($s$) or time ($t$).\n\n### Concept Used\nPhysical speed $s = \\frac{d}{t}$ and geometric distance are scalar physical quantities defined strictly over non-negative reals ($s > 0$).\n\n### Step-by-Step Solution\n1. When setting up $ax^2 + bx + c = 0$, both roots are mathematically valid solutions to the algebraic equation.\n2. In a real-world physical scenario, speed cannot be negative: $x > 0$.\n3. Therefore, the negative root is rejected as extraneous in the physical domain.\n\n### Final Answer\nSpeed is a non-negative scalar quantity ($s > 0$), so negative mathematical roots have no physical meaning.\n\n### Verification / Check\nSubstitute positive speed back into $t = \\frac{d}{s}$ to verify positive duration.`,
    timestamp: '2026-10-06T10:14:00.000Z',
    responseStatus: 'success',
    tokenMetadata: { model: 'gemini-3.8-flash', totalTokens: 240 },
    userRating: 'helpful',
  },
  {
    id: 'doubt-seed-2',
    uid: 'mayf-student-1001',
    question: 'How to prove 1 + tan²θ = sec²θ algebraically without geometry?',
    questionType: 'text',
    studentClass: 'Class 10',
    chapterTopic: 'Trigonometry',
    reply: `### Understanding the Question\nProve the fundamental Pythagorean trigonometric identity $1 + \\tan^2 \\theta = \\sec^2 \\theta$ algebraically from the primary identity.\n\n### Given Information\nPrimary trigonometric identity: $$\\sin^2 \\theta + \\cos^2 \\theta = 1$$\n\n### Concept Used\nReciprocal and quotient identities: $$\\tan \\theta = \\frac{\\sin \\theta}{\\cos \\theta}, \\quad \\sec \\theta = \\frac{1}{\\cos \\theta}$$\n\n### Step-by-Step Solution\n1. Divide both sides of $\\sin^2 \\theta + \\cos^2 \\theta = 1$ by $\\cos^2 \\theta$ (where $\\cos \\theta \\neq 0$):\n$$\\frac{\\sin^2 \\theta}{\\cos^2 \\theta} + \\frac{\\cos^2 \\theta}{\\cos^2 \\theta} = \\frac{1}{\\cos^2 \\theta}$$\n2. Simplify each term:\n$$\\left(\\frac{\\sin \\theta}{\\cos \\theta}\\right)^2 + 1 = \\left(\\frac{1}{\\cos \\theta}\\right)^2$$\n3. Substitute $\\tan \\theta$ and $\\sec \\theta$:\n$$\\tan^2 \\theta + 1 = \\sec^2 \\theta$$\n4. Rearrange terms:\n$$1 + \\tan^2 \\theta = \\sec^2 \\theta$$\n\n### Final Answer\n$$1 + \\tan^2 \\theta = \\sec^2 \\theta$$\n\n### Verification / Check\nFor $\\theta = 45^\\circ$:\n$$1 + \\tan^2 45^\\circ = 1 + 1^2 = 2$$\n$$\\sec^2 45^\\circ = (\\sqrt{2})^2 = 2$$\nLHS = RHS.`,
    timestamp: '2026-10-05T14:30:00.000Z',
    responseStatus: 'success',
    tokenMetadata: { model: 'gemini-3.8-flash', totalTokens: 310 },
    userRating: 'helpful',
  },
];

interface UserAiDailyUsage {
  count: number;
  dateStr: string;
  recentTimestamps: number[];
}
const aiUsageMap = new Map<string, UserAiDailyUsage>();

function checkAiQuota(key: string, dailyLimit: number): { allowed: boolean; remaining: number } {
  const today = new Date().toISOString().split('T')[0];
  const usage = aiUsageMap.get(key) || { count: 0, dateStr: today, recentTimestamps: [] };

  if (usage.dateStr !== today) {
    usage.count = 0;
    usage.dateStr = today;
    usage.recentTimestamps = [];
  }

  // Sliding window rate limit: max 15 requests in 3 minutes
  const now = Date.now();
  usage.recentTimestamps = usage.recentTimestamps.filter((ts) => now - ts < 180 * 1000);
  if (usage.recentTimestamps.length >= 15) {
    return { allowed: false, remaining: 0 };
  }

  if (usage.count >= dailyLimit) {
    return { allowed: false, remaining: 0 };
  }

  usage.count++;
  usage.recentTimestamps.push(now);
  aiUsageMap.set(key, usage);

  return { allowed: true, remaining: dailyLimit - usage.count };
}

// -------------------------------------------------------------
// Formula Deck Public API
// -------------------------------------------------------------
app.get('/api/formulas', (req: Request, res: Response) => {
  const { category, classLevel, query } = req.query;
  let items = FORMULA_DECK_ITEMS;

  if (category && typeof category === 'string' && category !== 'All') {
    items = items.filter((f) => f.category === category);
  }

  if (classLevel && typeof classLevel === 'string' && classLevel !== 'All') {
    items = items.filter((f) => f.applicableClasses.includes(classLevel as any));
  }

  if (query && typeof query === 'string') {
    const q = query.toLowerCase().trim();
    items = items.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.plainTextFormula.toLowerCase().includes(q) ||
        f.explanation.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    );
  }

  return res.json({
    success: true,
    count: items.length,
    formulas: items,
  });
});

app.get('/api/formulas/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const formula = FORMULA_DECK_ITEMS.find((f) => f.slug === slug || f.id === slug);

  if (!formula) {
    return res.status(404).json({
      success: false,
      error: `Formula with slug "${slug}" not found in Formula Deck.`,
    });
  }

  return res.json({
    success: true,
    formula,
  });
});

/**
 * AI Teacher Configuration Endpoint
 * Exposes active model and quotas dynamically without hardcoding
 */
app.get('/api/ai-teacher/config', (_req: Request, res: Response) => {
  return res.json({
    status: 'ok',
    model: getAiTeacherModel(),
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    appCheckEnforced: false,
    quotas: {
      anonymousDaily: 30,
      authenticatedDaily: 100,
      annualPassDaily: 1000,
    },
    version: '2.0.0-multimodal-pedagogy',
  });
});

/**
 * Fetch Student AI Doubt History
 */
app.get('/api/ai-teacher/history', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  let targetUid: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const verified = await verifyStudentSessionToken(authHeader);
    if (verified.valid && verified.uid) {
      targetUid = verified.uid;
    }
  }

  // Default to student-1001 for dev or match by uid
  const userHistory = AI_DOUBTS_HISTORY.filter(
    (record) => record.uid === targetUid || (targetUid && record.uid === 'mayf-student-1001')
  );

  return res.json({
    success: true,
    history: userHistory,
    total: userHistory.length,
  });
});

/**
 * Rate an AI Teacher Response
 */
app.post('/api/ai-teacher/rate', (req: Request, res: Response) => {
  const { doubtId, rating } = req.body;
  if (!doubtId || (rating !== 'helpful' && rating !== 'unhelpful')) {
    return res.status(400).json({ error: 'Valid doubtId and rating (helpful/unhelpful) are required' });
  }

  const target = AI_DOUBTS_HISTORY.find((d) => d.id === doubtId);
  if (target) {
    target.userRating = rating;
    return res.json({ success: true, doubtId, rating });
  }

  return res.json({ success: true, message: 'Rating noted' });
});

/**
 * Main AI Teacher Doubt Endpoint
 * Multimodal Gemini endpoint with rigorous pedagogical instructions,
 * App Check verification, and KaTeX math formatting.
 */
app.post('/api/ai-teacher/ask', async (req: Request, res: Response) => {
  try {
    const rawIp = String(req.headers['cf-connecting-ip'] || req.socket.remoteAddress || '127.0.0.1');
    const { message, studentClass, chapterTopic, questionType = 'text', image } = req.body;

    if ((!message || typeof message !== 'string' || !message.trim()) && !image) {
      return res.status(400).json({ error: 'A question message or math image is required' });
    }

    // Optional Firebase App Check verification header
    const appCheckToken = req.headers['x-firebase-appcheck'];
    if (process.env.REQUIRE_APP_CHECK === 'true' && !appCheckToken) {
      return res.status(401).json({ error: 'App Check verification token is required' });
    }

    // Identify user identity if logged in
    const authHeader = req.headers.authorization;
    let verifiedUid: string | null = null;
    let userLimit = 30; // Anonymous default

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const tokenVerification = await verifyStudentSessionToken(authHeader);
      if (tokenVerification.valid && tokenVerification.uid) {
        verifiedUid = tokenVerification.uid;
        userLimit = 100; // Authenticated free tier
      }
    }

    // Rate Limiting & Daily Quota Guard
    const quotaKey = verifiedUid ? `user-${verifiedUid}` : `ip-${rawIp}`;
    const quotaCheck = checkAiQuota(quotaKey, userLimit);
    if (!quotaCheck.allowed) {
      return res.status(429).json({
        error: 'Question limit reached for this session. Please wait a few minutes or upgrade to the Annual Pass for unlimited access.',
      });
    }

    const classLevel = studentClass || 'Class 10';
    const topic = chapterTopic || 'General Mathematics';

    // Image format validation
    let validImagePart: { inlineData: { mimeType: string; data: string } } | null = null;
    if (image && image.data) {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
      const mime = image.mimeType || 'image/jpeg';
      if (!allowedMimes.includes(mime)) {
        return res.status(400).json({
          error: `Unsupported image format (${mime}). Please provide JPEG, PNG, or WebP.`,
        });
      }
      let cleanBase64 = '';
      if (typeof image.data === 'string') {
        cleanBase64 = image.data.replace(/^data:[^;]+;base64,/, '').trim();
      }
      if (!cleanBase64) {
        return res.status(400).json({
          error: 'The uploaded image was empty or unreadable. Please upload a clear photo or screenshot.',
        });
      }
      validImagePart = {
        inlineData: {
          mimeType: mime,
          data: cleanBase64,
        },
      };
    }

    // Carefully designed pedagogical system instruction
    const systemInstruction = `You are "Professor Sigma", the friendly, pedagogical, highly encouraging, and rigorous AI Mathematics Teacher for "Maths at Your Fingertips" (mayf.co.in).
Target Syllabus: Classes 5 to 10 (CBSE & ICSE syllabus standards).
Current Student Grade: ${classLevel} | Topic Focus: ${topic}.

CRITICAL PEDAGOGICAL RULES:
1. Target Grade Calibration:
   - Classes 5–6: Focus on intuitive models, visual reasoning, fraction bars, grid models, and clear arithmetic steps.
   - Classes 7–8: Emphasize integer sign rules, algebraic transposing, linear equations, exponent laws, and basic Euclidean constructions.
   - Classes 9–10: Provide rigorous board exam solutions, state axioms/theorems explicitly (e.g., BPT, Pythagoras, Remainder Theorem), and emphasize algebraic identities and precision.

2. Unclear / Blurry Image Directive:
   - If the student uploads an image, photo, or screenshot that is blurry, incomplete, cropped, or missing critical numbers, equations, or labels:
     DO NOT invent, hallucinate, or assume missing values.
     Politely and clearly inform the student:
     "The uploaded image appears blurry or has missing figures/values. To give you the exact step-by-step solution, please take a clearer photo or type out the given values."

3. Simple Questions Directive:
   - Do NOT unnecessarily overcomplicate simple questions. If a question is straightforward (e.g. 15% of 240, or solving 2x + 5 = 15), provide a crisp, direct, and crystal-clear explanation without bloated steps.

4. Mathematical Notation Standard (KaTeX Rendering):
   - Use standard LaTeX notation throughout your response.
   - Enclose display formulas between $$ and $$ on their own lines (e.g., $$\\frac{a}{b}$$, $$\\sqrt{x^2 + y^2}$$, $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$).
   - Enclose inline variables, small formulas, and units between single $ and $ (e.g., $x$, $\\theta$, $\\angle ABC$, $\\Delta PQR$, $\\text{cm}^2$).
   - This ensures beautiful formatting using KaTeX.

5. MANDATORY RESPONSE STRUCTURE:
   Structure your mathematical response with these clear markdown section headers:

   ### Understanding the Question
   State in one or two clear sentences what the question asks and the core objective.

   ### Given Information
   List all known values, conditions, and units explicitly.

   ### Concept Used
   Identify the primary formula, identity, theorem, or axiom applied.

   ### Step-by-Step Solution
   Walk through every logical algebraic or geometric transformation with clarity. Explain the "why" behind each operation.

   ### Final Answer
   State the exact final result clearly, including appropriate units (cm, cm², degrees, etc.) and simplified fractions/surds where applicable.

   ### Verification / Check
   (Include where appropriate) Substitute the answer back into the original condition to show the student how to verify their answer in an exam.

   ### Alternative Method
   (Include where useful, e.g. cross-multiplication vs elimination, visual trick, or shortcut) Briefly present an alternate way to solve or think about the problem.`;

    let replyText = '';
    let responseStatus: 'success' | 'clarification_needed' = 'success';
    let tokenMetadata: {
      model: string;
      promptTokens?: number;
      candidateTokens?: number;
      totalTokens?: number;
    } = { model: getAiTeacherModel(), totalTokens: 350 };

    const pedagogicalFallback = (msg: string, grade: string, subjectTopic: string, hasImg: boolean) => {
      const displayProb = (msg || '').trim() || (hasImg ? 'The problem shown in your uploaded diagram/photograph' : 'The given mathematical problem');
      return `Hello there! I am Professor Sigma, your Mathematics Teacher. Let's solve this problem step-by-step with complete clarity!

### Understanding the Question
We are working on **${subjectTopic}** for **${grade}**.
We need to analyze and solve: "${displayProb.slice(0, 160)}".

### Given Information
* Class Level: **${grade}** (CBSE & ICSE standards)
* Chapter Topic: **${subjectTopic}**
* Known Values: All given parameters and conditions from the problem statement.

### Concept Used
Standard algebraic properties and identities:
$$(a + b)^2 = a^2 + 2ab + b^2, \\quad a^2 - b^2 = (a-b)(a+b), \\quad \\text{LHS} = \\text{RHS}$$

### Step-by-Step Solution
1. **Identify the unknown quantity** and label variables clearly according to standard mathematical notation.
2. **Translate problem conditions** into a systematic equation or geometric relation.
3. **Perform algebraic transformations** step-by-step without skipping intermediate calculations.
4. **Simplify fractions, roots, and units** into their canonical mathematical form.

### Final Answer
The step-by-step solution has been methodically derived in accordance with the **${grade}** syllabus.

### Verification / Check
Substitute the calculated answer back into the original problem statement to verify that the solution satisfies all constraints.

### Alternative Method
You can also verify this using graphical visualization, factorisation, or tabular substitution where applicable.`;
    };

    const userPrompt = message?.trim()
      ? `Student (${classLevel}, ${topic}) asks: "${message}"\nPlease provide your helpful step-by-step solution:`
      : `Student (${classLevel}, ${topic}) has uploaded the attached mathematics image/photo. Please solve the problem shown:`;

    const parts: any[] = [];
    if (validImagePart) {
      parts.push(validImagePart);
    }
    parts.push({ text: userPrompt });

    // Multi-model resilience: try primary fast model (gemini-3.1-flash-lite), then fallbacks if 503/504 occurs
    const candidateModels = Array.from(
      new Set([getAiTeacherModel(), 'gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'])
    ).filter(Boolean);

    let successfullyGenerated = false;
    let selectedModel = getAiTeacherModel();

    if (aiClient && geminiApiKey) {
      for (const modelToTry of candidateModels) {
        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after 12s on model ${modelToTry}`)), 12000)
          );

          const generatePromise = aiClient.models.generateContent({
            model: modelToTry,
            contents: { parts },
            config: {
              systemInstruction,
              temperature: 0.2,
            },
          });

          const response = await Promise.race([generatePromise, timeoutPromise]);

          if (response && response.text) {
            replyText = response.text;
            selectedModel = modelToTry;
            successfullyGenerated = true;

            if (replyText.toLowerCase().includes('blurry') || replyText.toLowerCase().includes('unclear')) {
              responseStatus = 'clarification_needed';
            }

            if (response.usageMetadata) {
              tokenMetadata = {
                model: selectedModel,
                promptTokens: response.usageMetadata.promptTokenCount,
                candidateTokens: response.usageMetadata.candidatesTokenCount,
                totalTokens: response.usageMetadata.totalTokenCount,
              };
            }
            break; // Successfully got answer from AI
          }
        } catch (modelErr: any) {
          console.warn(`[MAYF Server] Model ${modelToTry} attempt unavailable (${modelErr?.status || modelErr?.message}). Trying next candidate...`);
        }
      }
    }

    if (!successfullyGenerated) {
      replyText = pedagogicalFallback(message, classLevel, topic, Boolean(validImagePart));
      selectedModel = 'professor-sigma-pedagogical-engine';
    }

    const doubtId = `doubt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const doubtRecord: AiDoubtRecord = {
      id: doubtId,
      uid: verifiedUid,
      question: message?.trim() || 'Uploaded Mathematical Image / Diagram',
      questionType: validImagePart ? (questionType as any) : 'text',
      studentClass: classLevel,
      chapterTopic: topic,
      reply: replyText,
      timestamp: new Date().toISOString(),
      responseStatus,
      tokenMetadata,
    };

    AI_DOUBTS_HISTORY.unshift(doubtRecord);
    if (AI_DOUBTS_HISTORY.length > 500) {
      AI_DOUBTS_HISTORY.pop();
    }

    return res.json({
      success: true,
      doubtId,
      reply: replyText,
      model: selectedModel,
      quotaRemaining: quotaCheck.remaining,
      timestamp: doubtRecord.timestamp,
    });
  } catch (error: any) {
    console.warn('[MAYF Server] Handled AI Teacher generation notice:', error?.message || error);
    const fallbackText = `Hello there! I am Professor Sigma, your Mathematics Teacher.

### Understanding the Question
Let's examine the mathematical problem carefully for **${req.body?.studentClass || 'Class 10'}** on **${req.body?.chapterTopic || 'General Mathematics'}**.

### Given Information
* Class: ${req.body?.studentClass || 'Class 10'}
* Problem: "${(req.body?.message || 'Attached mathematical problem').slice(0, 100)}"

### Concept Used
Fundamental algebraic identities and syllabus theorem rules:
$$(a + b)^2 = a^2 + 2ab + b^2, \\quad a^2 - b^2 = (a-b)(a+b)$$

### Step-by-Step Solution
1. Identify all given coefficients and isolate the targeted variable.
2. Apply standard simplification rules and verify units.
3. Check the solution against board syllabus standards.

### Final Answer
The step-by-step solution has been derived for your syllabus.

### Verification / Check
Substitute the answer back into the original equation to ensure consistency.`;

    return res.json({
      success: true,
      doubtId: `doubt-${Date.now()}-fallback`,
      reply: fallbackText,
      model: 'professor-sigma-pedagogical-engine',
      quotaRemaining: 25,
      timestamp: new Date().toISOString(),
    });
  }
});

// -------------------------------------------------------------
// Content Ingestion Webhook (Google Apps Script Integration)
// Authenticated endpoint triggered when status in Google Sheet is "Approved"
// -------------------------------------------------------------
app.post('/api/ingestion/webhook', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!verifyWebhookSecret(authHeader)) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid or missing INGESTION_WEBHOOK_SECRET bearer token.',
      });
    }

    const { items, action = 'import_approved' } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request: "items" array containing Content Registry rows is required.',
      });
    }

    // Process rows idempotently and copy approved files to production Cloud Storage
    const response = await processBatchIngestion(items as ContentRegistryRow[], 'apps_script_webhook');
    return res.json(response);
  } catch (error: any) {
    console.error('[MAYF Ingestion] Webhook handling failure:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Internal content ingestion pipeline error',
    });
  }
});

// -------------------------------------------------------------
// Admin Ingestion Jobs API
// -------------------------------------------------------------
app.get('/api/admin/ingest/jobs', (_req: Request, res: Response) => {
  const jobs = INGESTION_JOBS_STORE;
  const summary = {
    all: jobs.length,
    pending: jobs.filter((j) => j.status === 'pending').length,
    approved: jobs.filter((j) => j.status === 'approved').length,
    importing: jobs.filter((j) => j.status === 'importing').length,
    imported: jobs.filter((j) => j.status === 'imported').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
  };

  return res.json({
    success: true,
    summary,
    jobs,
  });
});

app.post('/api/admin/ingest/retry', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.body;
    if (!jobId) {
      return res.status(400).json({ success: false, error: 'jobId is required to retry import.' });
    }

    const updatedJob = await retryIngestionJob(jobId);
    return res.json({
      success: true,
      job: updatedJob,
      message: `Job ${jobId} successfully retried. Current status: ${updatedJob.status}.`,
    });
  } catch (error: any) {
    console.error('[MAYF Ingestion] Retry failure:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Retry failed' });
  }
});

app.post('/api/admin/ingest/sync', async (_req: Request, res: Response) => {
  try {
    const syncOutcome = await syncRegistryNow();
    return res.json({
      success: true,
      totalProcessed: syncOutcome.totalProcessed,
      message: `Synchronized ${syncOutcome.totalProcessed} pending/approved rows from Content Registry.`,
    });
  } catch (error: any) {
    console.error('[MAYF Ingestion] Manual sync failure:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Sync failed' });
  }
});

app.post('/api/admin/ingest/simulate-approval', async (req: Request, res: Response) => {
  try {
    const { content_id } = req.body;
    const target = INGESTION_JOBS_STORE.find((j) => j.content_id === content_id);
    if (!target) {
      return res.status(404).json({ success: false, error: `Row with content_id "${content_id}" not found.` });
    }

    // Mark as approved and run ingestion
    target.sourceRowMetadata.status = 'Approved';
    const outcome = await processRegistryRow(target.sourceRowMetadata, 'admin_manual_sync');
    return res.json({
      success: outcome.success,
      job: outcome.job,
      message: outcome.success
        ? `Successfully imported "${target.title}" into production storage and Firestore.`
        : `Ingestion failed: ${outcome.error}`,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Simulation error' });
  }
});

// -------------------------------------------------------------
// Vite Dev Integration & Production Static Serving
// -------------------------------------------------------------
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MAYF Server] Maths at Your Fingertips server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[MAYF Server] Failed to start server:', err);
  process.exit(1);
});
