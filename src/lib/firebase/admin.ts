/**
 * Server-Side Firebase Admin SDK configuration and user-management services.
 * 
 * SECURITY NOTICE:
 * This module MUST NEVER be imported in client code.
 * It is invoked exclusively within Node.js / Express server routes (`server.ts`).
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import type { App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { Auth, UserRecord } from 'firebase-admin/auth';
import { FirestoreDocumentStore } from './documentStore';

export interface FirebaseAdminConfig {
  projectId: string;
  clientEmail: string;
  hasPrivateKey: boolean;
  isReady: boolean;
}

function serviceAccountFields(): { project_id?: string; client_email?: string; private_key?: string } {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) return {};
  try {
    const value = JSON.parse(raw);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}

export function getFirebaseAdminConfig(): FirebaseAdminConfig {
  const account = serviceAccountFields();
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || account.project_id || process.env.VITE_FIREBASE_PROJECT_ID || 'maths-at-your-fingertips';
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || account.client_email || '';

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || account.private_key;

  // The owner confirmed this existing project's data is disposable (2026-10-22).
  // Reuse requires explicit staging-only opt-in; never infer it from a project ID.
  const approvedSharedDevelopment = process.env.APP_ENV === 'staging' &&
    process.env.MAYF_ALLOW_SHARED_DEVELOPMENT_FIREBASE === 'true' &&
    projectId === 'maths-at-your-fingertips' &&
    account.project_id === projectId;
  const safeStagingCredentials = process.env.APP_ENV !== 'staging' ||
    (Boolean(account.project_id) && account.project_id === projectId &&
      clientEmail === account.client_email &&
      clientEmail.endsWith('@' + projectId + '.iam.gserviceaccount.com') &&
      (approvedSharedDevelopment || account.project_id !== 'maths-at-your-fingertips'));

  return {
    projectId,
    clientEmail,
    hasPrivateKey: Boolean(privateKey && privateKey.length > 20),
    isReady: Boolean(privateKey && privateKey.length > 20 && projectId && clientEmail && safeStagingCredentials),
  };
}

/** Safe presence diagnostics; never include credential values or token material. */
export function getFirebaseAdminDiagnostics() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  let jsonReadable = false;
  if (raw) {
    try { const value = JSON.parse(raw); jsonReadable = Boolean(value && typeof value === 'object' && !Array.isArray(value)); }
    catch { /* Report format only, without logging secret text. */ }
  }
  const account = serviceAccountFields();
  return {
    serviceAccountJsonPresent: Boolean(raw),
    serviceAccountJsonReadable: jsonReadable,
    projectIdPresent: Boolean(process.env.FIREBASE_ADMIN_PROJECT_ID || account.project_id),
    clientEmailPresent: Boolean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL || account.client_email),
    privateKeyPresent: Boolean(process.env.FIREBASE_ADMIN_PRIVATE_KEY || account.private_key),
  };
}

let adminAppInstance: App | null = null;
let adminAuthInstance: Auth | null = null;
let adminFirestoreInstance: FirestoreDocumentStore | null = null;

function formatPrivateKey(rawKey?: string): string | undefined {
  if (!rawKey) return undefined;
  let formatted = rawKey.replace(/\\n/g, '\n').trim();
  if (!formatted.includes('BEGIN PRIVATE KEY')) {
    formatted = `-----BEGIN PRIVATE KEY-----\n${formatted}\n-----END PRIVATE KEY-----`;
  }
  return formatted;
}

/**
 * Initializes and retrieves the singleton Firebase Admin App instance.
 */
export function getFirebaseAdminApp(): App | null {
  if (process.env.APP_ENV === 'staging' && !getFirebaseAdminConfig().isReady) return null;
  if (adminAppInstance) {
    return adminAppInstance;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminAppInstance = existingApps[0];
    return adminAppInstance;
  }

  const config = getFirebaseAdminConfig();
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || serviceAccountFields().private_key;

  if (rawKey && config.clientEmail && config.projectId) {
    try {
      const privateKey = formatPrivateKey(rawKey);
      if (privateKey) {
        adminAppInstance = initializeApp({
          credential: cert({
            projectId: config.projectId,
            clientEmail: config.clientEmail,
            privateKey,
          }),
          projectId: config.projectId,
        });
        console.info('[Firebase Admin] Successfully initialized Firebase Admin SDK for project:', config.projectId);
        return adminAppInstance;
      }
    } catch (error: any) {
      console.warn('[Firebase Admin] Notice: Initializing Firebase Admin with project ID fallback:', error?.message);
    }
  }

  try {
    adminAppInstance = initializeApp({
      projectId: config.projectId,
    });
    return adminAppInstance;
  } catch (err: any) {
    console.warn('[Firebase Admin] Could not initialize fallback Firebase Admin App:', err?.message);
    return null;
  }
}

/**
 * Returns the Firebase Admin Auth client.
 */
export function getAdminAuth(): Auth | null {
  if (adminAuthInstance) {
    return adminAuthInstance;
  }
  const app = getFirebaseAdminApp();
  if (!app) return null;
  try {
    adminAuthInstance = getAuth(app);
    return adminAuthInstance;
  } catch (error: any) {
    console.warn('[Firebase Admin] getAuth warning:', error?.message);
    return null;
  }
}

/**
 * Returns the Firebase Admin Firestore client.
 */
export function getAdminFirestore(): FirestoreDocumentStore | null {
  // Workers has no Google VM metadata credentials. Require explicit server credentials.
  if (!getFirebaseAdminConfig().isReady && !process.env.FIRESTORE_EMULATOR_HOST) return null;
  if (adminFirestoreInstance) {
    return adminFirestoreInstance;
  }
  const app = getFirebaseAdminApp();
  if (!app) return null;
  try {
    adminFirestoreInstance = new FirestoreDocumentStore(getFirebaseAdminConfig().projectId, async () => {
      const credential = app.options.credential;
      if (!credential) throw new Error('Firebase service credentials are missing');
      return (await credential.getAccessToken()).access_token;
    });
    return adminFirestoreInstance;
  } catch (error: any) {
    console.warn('[Firebase Admin] getFirestore warning:', error?.message);
    return null;
  }
}

export interface TokenVerificationResult {
  valid: boolean;
  uid?: string;
  email?: string;
  role?: 'student' | 'admin' | 'superAdmin';
  admin?: boolean;
  superAdmin?: boolean;
  pro?: boolean;
  annualPass?: boolean;
  annualPassExpiry?: string;
  error?: string;
}

/**
 * Verify student / administrator Firebase ID Token on server-side using Firebase Admin SDK
 */
export async function verifyStudentSessionToken(bearerToken?: string): Promise<TokenVerificationResult> {
  if (!bearerToken) {
    return { valid: false, error: 'No authorization token provided' };
  }

  const cleanToken = bearerToken.replace(/^Bearer\s+/i, '').trim();
  if (!cleanToken) {
    return { valid: false, error: 'Empty token string provided' };
  }

  const adminEmails = (process.env.ADMIN_AUTHORIZED_EMAILS || '2026vivekkushwah@gmail.com,ntnagrawal146@gmail.com,admin@mayf.co.in,mayfbackup@gmail.com')
    .toLowerCase()
    .split(',')
    .map((e) => e.trim());

  // 1. Authoritative verification via Firebase Admin SDK
  const authClient = getAdminAuth();
  const config = getFirebaseAdminConfig();

  if (authClient && cleanToken.split('.').length === 3 && !cleanToken.startsWith('dev-') && !cleanToken.startsWith('mock-')) {
    try {
      // Only verify revocation if full private key credentials are configured
      // (checking revocation requires calling Google IAM endpoints with service account credentials)
      const decoded = await authClient.verifyIdToken(cleanToken, config.hasPrivateKey);
      const email = (decoded.email || '').toLowerCase().trim();
      const isSuperAdminClaim = decoded.superAdmin === true || decoded.role === 'superAdmin';
      const isAdminClaim = isSuperAdminClaim || decoded.admin === true || decoded.role === 'admin';
      const isAuthorizedEmail = Boolean(decoded.email_verified && email && adminEmails.includes(email));

      // Administrative rights require genuine verified custom claims or authorized email verified by Firebase
      const isSuperAdmin =
        isSuperAdminClaim ||
        (isAuthorizedEmail && (email === '2026vivekkushwah@gmail.com' || email === 'ntnagrawal146@gmail.com'));
      const isAdmin = isAdminClaim || isAuthorizedEmail;
      const role = isSuperAdmin ? 'superAdmin' : isAdmin ? 'admin' : 'student';

      return {
        valid: true,
        uid: decoded.uid,
        email: decoded.email,
        role,
        admin: isAdmin,
        superAdmin: isSuperAdmin,
        pro: Boolean(decoded.pro || decoded.annualPass),
        annualPass: Boolean(decoded.annualPass),
        annualPassExpiry: decoded.annualPassExpiry as string | undefined,
      };
    } catch (e: any) {
      console.warn('[Firebase Admin] verifyIdToken note:', e?.code || e?.message);

      // Never trust decoded claims after cryptographic verification fails.
      // Configuration errors must be corrected instead of granting access.

      return {
        valid: false,
        error: 'Invalid, forged, or expired Firebase ID token',
      };
    }
  }

  const isProduction = process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production';
  if (isProduction) {
    // In production, unverified tokens or mock tokens are strictly forbidden
    return {
      valid: false,
      error: 'Cryptographic authentication verification failed: unverified tokens rejected in production',
    };
  }

  // 2. Fallback ONLY for local sandbox development when Firebase Admin credentials are not yet provisioned
  // In development sandbox ONLY: mock tokens explicitly starting with mock-, dev-, or student-
  if (
    cleanToken.startsWith('mock-') ||
    cleanToken.startsWith('dev-') ||
    cleanToken.startsWith('student-') ||
    cleanToken === 'mayf-student-1001'
  ) {
    const isSuper =
      cleanToken === 'dev-superadmin-token' ||
      cleanToken === 'mock-superadmin-token' ||
      cleanToken.includes('superadmin') ||
      cleanToken.includes('2026vivekkushwah@gmail.com') ||
      cleanToken.includes('ntnagrawal146@gmail.com');
    const isAdmin =
      isSuper ||
      cleanToken === 'dev-admin-token' ||
      cleanToken === 'mock-admin-token' ||
      cleanToken.includes('admin');
    const email = cleanToken.includes('ntnagrawal146@gmail.com')
      ? 'ntnagrawal146@gmail.com'
      : isSuper
      ? '2026vivekkushwah@gmail.com'
      : isAdmin
      ? 'admin@mayf.co.in'
      : 'student@mayf.co.in';

    const role = isSuper ? 'superAdmin' : isAdmin ? 'admin' : 'student';

    const uid = isSuper
      ? 'admin-super-001'
      : isAdmin
      ? 'admin-002'
      : cleanToken.startsWith('dev-student-')
      ? cleanToken.replace('dev-student-', '')
      : cleanToken.startsWith('student-')
      ? cleanToken
      : cleanToken === 'mayf-student-1001'
      ? 'mayf-student-1001'
      : cleanToken.slice(0, 28);

    return {
      valid: true,
      uid,
      email,
      role,
      admin: isAdmin,
      superAdmin: isSuper,
      pro: isAdmin || isSuper || cleanToken.includes('pass') || uid === 'mayf-student-1001',
      annualPass: isAdmin || isSuper || cleanToken.includes('pass') || uid === 'mayf-student-1001',
    };
  }

  // Fallback for non-production development without active service account credentials
  const jwtParts = cleanToken.split('.');
  if (jwtParts.length === 3 && !authClient) {
    try {
      const payloadJson = Buffer.from(jwtParts[1], 'base64').toString('utf8');
      const payload = JSON.parse(payloadJson);
      const email = (payload.email || '').toLowerCase();
      const uid = payload.user_id || payload.sub || 'user-' + cleanToken.slice(0, 12);

      const isSuperAdmin = email === '2026vivekkushwah@gmail.com' || email === 'ntnagrawal146@gmail.com';
      const isAdmin = isSuperAdmin || adminEmails.includes(email);
      const role = isSuperAdmin ? 'superAdmin' : isAdmin ? 'admin' : 'student';

      return {
        valid: true,
        uid,
        email,
        role,
        admin: isAdmin,
        superAdmin: isSuperAdmin,
        pro: isAdmin || isSuperAdmin,
        annualPass: isAdmin || isSuperAdmin,
      };
    } catch {
      // Continue to rejection
    }
  }

  return {
    valid: false,
    error: 'Invalid or unverified authentication token',
  };
}

/**
 * Assign custom claims to a Firebase user and force refresh tokens.
 */
export async function adminSetCustomUserClaims(uid: string, claims: Record<string, any>): Promise<{ success: boolean; error?: string }> {
  const auth = getAdminAuth();
  if (!auth) throw new Error('Firebase user management is unavailable');
  const user = await auth.getUser(uid);
  const merged = { ...user.customClaims };
  for (const [key, value] of Object.entries(claims)) {
    if (value === undefined) delete merged[key];
    else merged[key] = value;
  }
  await auth.setCustomUserClaims(uid, merged);
  await auth.revokeRefreshTokens(uid);
  return { success: true };
}

/**
 * Revoke refresh tokens to force ID token re-issuance
 */
export async function adminRevokeRefreshTokens(uid: string): Promise<boolean> {
  const authClient = getAdminAuth();
  if (authClient) {
    try {
      await authClient.revokeRefreshTokens(uid);
      console.info(`[Firebase Admin SDK] Revoked refresh tokens for UID ${uid}`);
      return true;
    } catch (e: any) {
      throw e;
    }
  }
  throw new Error('Firebase user management is unavailable');
}

/**
 * Disable or enable a user account via Firebase Admin SDK
 */
export async function adminUpdateUserDisabledStatus(
  uid: string,
  disabled: boolean
): Promise<{ success: boolean; error?: string }> {
  const authClient = getAdminAuth();
  if (authClient) {
    try {
      await authClient.updateUser(uid, { disabled });
      if (disabled) {
        await authClient.revokeRefreshTokens(uid);
      }
      return { success: true };
    } catch (error: any) {
      throw error;
    }
  }
  throw new Error('Firebase user management is unavailable');
}

/**
 * Delete a user from Firebase Auth via Admin SDK
 */
export async function adminDeleteAuthUser(uid: string): Promise<{ success: boolean; error?: string }> {
  const authClient = getAdminAuth();
  if (authClient) {
    try {
      await authClient.deleteUser(uid);
      console.info(`[Firebase Admin SDK] Successfully deleted user ${uid} from Firebase Auth`);
      return { success: true };
    } catch (error: any) {
      throw error;
    }
  }
  throw new Error('Firebase user management is unavailable');
}

/**
 * Retrieve user record by UID from Firebase Auth
 */
export async function adminGetAuthUser(uid: string): Promise<UserRecord | null> {
  const authClient = getAdminAuth();
  if (authClient) {
    try {
      return await authClient.getUser(uid);
    } catch {
      return null;
    }
  }
  return null;
}
