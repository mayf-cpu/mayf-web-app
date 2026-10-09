/**
 * Client-Side Analytics Engine
 * Maths at Your Fingertips (mayf.co.in)
 * 
 * Supports:
 * - GA4 (window.gtag)
 * - Firebase Analytics (getAnalytics & logEvent)
 * - Internal privacy-preserving aggregation endpoint (/api/analytics/track)
 * 
 * Privacy Invariants:
 * - Never collects or logs student names, emails, phone numbers, or passwords.
 * - AI math questions are recorded only as high-level topic categories and question lengths,
 *   strictly omitting private homework prompt text.
 */

import { getAnalytics, logEvent, isSupported, Analytics } from 'firebase/analytics';
import { app } from '../firebase/client';
import { hasRealFirebaseCredentials, getActiveFirebaseConfig } from '../firebase/config';
import {
  AnalyticsEventType,
  PageViewEventData,
  ContentViewEventData,
  ContentDownloadEventData,
  SearchEventData,
  FormulaViewEventData,
  AiQuestionEventData,
  LoginEventData,
  CheckoutStartedEventData,
  PurchaseEventData,
  AnnualPassPurchaseEventData,
  CouponAppliedEventData,
  ShareEventData,
} from './analyticsTypes';

let firebaseAnalyticsInstance: Analytics | null = null;
let analyticsInitialized = false;

// Global safety net for unhandled Firebase Installations SDK rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const errorMsg = String(event.reason?.message || event.reason || '');
    if (
      errorMsg.includes('installations/request-failed') ||
      errorMsg.includes('API key not valid') ||
      errorMsg.includes('INVALID_ARGUMENT')
    ) {
      // Suppress unhandled promise rejection for placeholder or non-production installation calls
      event.preventDefault();
      console.warn('[Analytics] Firebase Installations rejection safely handled:', errorMsg);
    }
  });
}

/**
 * Initializes GA4 dataLayer and gtag function shim if not already present
 */
function initGa4DataLayer(): void {
  if (typeof window === 'undefined') return;
  const win = window as unknown as { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
  win.dataLayer = win.dataLayer || [];
  if (typeof win.gtag !== 'function') {
    win.gtag = function () {
      win.dataLayer?.push(arguments);
    };
  }
}

// Initialize Firebase Analytics safely (client-side only, if genuine credentials are present)
async function initFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return null;
  if (analyticsInitialized) return firebaseAnalyticsInstance;

  initGa4DataLayer();

  // If running in development, preview, or placeholder configuration,
  // do not invoke getAnalytics(app) to prevent Firebase Installations from throwing 400 INVALID_ARGUMENT
  if (!hasRealFirebaseCredentials()) {
    analyticsInitialized = true;
    return null;
  }

  try {
    const supported = await isSupported();
    if (supported) {
      firebaseAnalyticsInstance = getAnalytics(app);
    }
  } catch (err) {
    // Analytics may be blocked by client ad-blocker or offline; fail gracefully
    console.debug('[Analytics] Firebase Analytics init fallback:', err);
  }

  analyticsInitialized = true;
  return firebaseAnalyticsInstance;
}

// Immediately trigger background initialization
if (typeof window !== 'undefined') {
  initFirebaseAnalytics().catch(() => {});
}

/**
 * Strict Privacy Sanitizer: Strips out PII or sensitive keys
 */
export function sanitizeAnalyticsParams(params: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  const prohibitedKeys = [
    'email',
    'phone',
    'mobile',
    'name',
    'fullname',
    'studentname',
    'password',
    'token',
    'authorization',
    'secret',
    'question_text',
    'prompt',
    'query_full',
  ];

  for (const [key, val] of Object.entries(params)) {
    const lowerKey = key.toLowerCase();
    if (prohibitedKeys.some((prohibited) => lowerKey.includes(prohibited))) {
      continue; // Exclude prohibited PII fields
    }

    // Check string values for potential email or phone patterns
    if (typeof val === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^(\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
      if (emailRegex.test(val) || phoneRegex.test(val)) {
        continue;
      }
      // Truncate overly long values
      sanitized[key] = val.slice(0, 150);
    } else if (typeof val === 'number' || typeof val === 'boolean') {
      sanitized[key] = val;
    } else if (Array.isArray(val)) {
      sanitized[key] = val.slice(0, 10).map((v) => (typeof v === 'string' ? v.slice(0, 50) : v));
    }
  }

  return sanitized;
}

/**
 * Core event dispatcher: dispatches to GA4, Firebase Analytics, and internal aggregation API
 */
export async function trackEvent(
  eventType: AnalyticsEventType,
  rawParams: Record<string, unknown> = {}
): Promise<void> {
  if (typeof window === 'undefined') return;

  const sanitized = sanitizeAnalyticsParams(rawParams);

  // 1. Dispatch to GA4 via window.gtag if present
  try {
    const win = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof win.gtag === 'function') {
      win.gtag('event', eventType, sanitized);
    }
  } catch (e) {
    console.debug('[Analytics] gtag dispatch notice:', e);
  }

  // 2. Dispatch to Firebase Analytics
  try {
    const analytics = await initFirebaseAnalytics();
    if (analytics) {
      logEvent(analytics, eventType as any, sanitized);
    }
  } catch (e) {
    console.debug('[Analytics] Firebase logEvent notice:', e);
  }

  // 3. Dispatch to internal backend for aggregate metrics rollup (O(1) counter update)
  try {
    const payload = JSON.stringify({
      eventType,
      params: sanitized,
      timestamp: new Date().toISOString(),
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/track', payload);
    } else {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Non-blocking fire-and-forget
  }
}

// -------------------------------------------------------------
// Strongly-Typed Event Helpers
// -------------------------------------------------------------

export function trackPageView(pageTitle: string, path: string): void {
  const data: PageViewEventData = {
    page_title: pageTitle,
    page_location: typeof window !== 'undefined' ? window.location.href : path,
    page_path: path,
  };
  trackEvent('page_view', data as unknown as Record<string, unknown>);
}

export function trackContentView(data: ContentViewEventData): void {
  trackEvent('content_view', data as unknown as Record<string, unknown>);
}

export function trackContentDownload(data: ContentDownloadEventData): void {
  trackEvent('content_download', data as unknown as Record<string, unknown>);
}

export function trackSearch(data: SearchEventData): void {
  // Trim search term and limit length
  const sanitizedSearch: SearchEventData = {
    search_term: (data.search_term || '').trim().slice(0, 60),
    results_count: data.results_count,
    category_filter: data.category_filter,
    class_filter: data.class_filter,
  };
  trackEvent('search', sanitizedSearch as unknown as Record<string, unknown>);
}

export function trackFormulaView(data: FormulaViewEventData): void {
  trackEvent('formula_view', data as unknown as Record<string, unknown>);
}

export function trackAiQuestion(data: AiQuestionEventData): void {
  // Notice: Strict privacy guarantee - NO question text stored
  trackEvent('ai_question', data as unknown as Record<string, unknown>);
}

export function trackLogin(method: LoginEventData['method']): void {
  trackEvent('login', { method });
}

export function trackCheckoutStarted(data: CheckoutStartedEventData): void {
  trackEvent('checkout_started', data as unknown as Record<string, unknown>);
}

export function trackPurchase(data: PurchaseEventData): void {
  trackEvent('purchase', data as unknown as Record<string, unknown>);
}

export function trackAnnualPassPurchase(data: AnnualPassPurchaseEventData): void {
  trackEvent('annual_pass_purchase', data as unknown as Record<string, unknown>);
}

export function trackCouponApplied(data: CouponAppliedEventData): void {
  trackEvent('coupon_applied', data as unknown as Record<string, unknown>);
}

export function trackShare(data: ShareEventData): void {
  trackEvent('share', data as unknown as Record<string, unknown>);
}
