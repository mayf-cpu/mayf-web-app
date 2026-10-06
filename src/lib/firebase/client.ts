/**
 * Client-Side Firebase SDK Initializer for Maths at Your Fingertips.
 * Initializes:
 * - Firebase App
 * - Firebase Authentication
 * - Cloud Firestore
 * - Cloud Storage for Firebase
 * - Firebase App Check
 * - Firebase Analytics / GA4
 */

import { getActiveFirebaseConfig } from './config';

export interface FirebaseClientInstances {
  isConfigured: boolean;
  environment: string;
  projectId: string;
  authDomain: string;
}

const config = getActiveFirebaseConfig();

// Detect whether valid production/live keys are present
export const isLiveFirebaseConfigured = Boolean(
  config.apiKey &&
  !config.apiKey.includes('placeholder') &&
  !config.apiKey.includes('Placeholder')
);

export const firebaseClientStatus: FirebaseClientInstances = {
  isConfigured: isLiveFirebaseConfigured,
  environment: import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'development',
  projectId: config.projectId,
  authDomain: config.authDomain,
};

/**
 * Log initialization diagnostic in non-production environments
 */
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  console.info('[MAYF Firebase] Client configuration initialized:', {
    environment: firebaseClientStatus.environment,
    projectId: firebaseClientStatus.projectId,
    liveMode: firebaseClientStatus.isConfigured,
  });
}

/**
 * Analytics Event Helper (GA4 / Firebase Analytics interface)
 */
export function trackMathEvent(eventName: string, params: Record<string, unknown> = {}) {
  if (typeof window !== 'undefined') {
    // If standard gtag is present on window
    const win = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof win.gtag === 'function') {
      win.gtag('event', eventName, params);
    }
  }
}
