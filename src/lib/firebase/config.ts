/**
 * Multi-environment Firebase options dictionary.
 * Supports:
 * - Development (local emulator or dev Firebase project)
 * - Staging (pre-production verification)
 * - Production (live mayf.co.in infrastructure)
 */

export interface FirebaseOptions {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  appCheckSiteKey?: string;
}

const getEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env) {
      return (import.meta as any).env[key];
    }
  } catch {
    // ignore
  }
  return undefined;
};

export const firebaseEnvironments: Record<'development' | 'staging' | 'production', FirebaseOptions> = {
  development: {
    apiKey: getEnv('VITE_FIREBASE_API_KEY') || 'AIzaSyDevPlaceholderKeyForLocalMAYF',
    authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || 'mayf-dev.firebaseapp.com',
    projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || 'mayf-dev',
    storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || 'mayf-dev.appspot.com',
    messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || '100000000001',
    appId: getEnv('VITE_FIREBASE_APP_ID') || '1:100000000001:web:dev000000000000',
    measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID') || 'G-DEV0000000',
    appCheckSiteKey: getEnv('VITE_FIREBASE_APP_CHECK_SITE_KEY'),
  },
  staging: {
    apiKey: getEnv('VITE_FIREBASE_API_KEY') || 'AIzaSyStagingPlaceholderKeyMAYF',
    authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || 'mayf-staging.firebaseapp.com',
    projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || 'mayf-staging',
    storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || 'mayf-staging.appspot.com',
    messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || '200000000002',
    appId: getEnv('VITE_FIREBASE_APP_ID') || '1:200000000002:web:staging00000000',
    measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID') || 'G-STAGING000',
    appCheckSiteKey: getEnv('VITE_FIREBASE_APP_CHECK_SITE_KEY'),
  },
  production: {
    apiKey: getEnv('VITE_FIREBASE_API_KEY') || 'AIzaSyProdPlaceholderKeyMAYF',
    authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || 'mayf-prod.firebaseapp.com',
    projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || 'mayf-prod',
    storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || 'mayf-prod.appspot.com',
    messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || '300000000003',
    appId: getEnv('VITE_FIREBASE_APP_ID') || '1:300000000003:web:prod0000000000',
    measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID') || 'G-PROD000000',
    appCheckSiteKey: getEnv('VITE_FIREBASE_APP_CHECK_SITE_KEY'),
  },
};

export function getActiveFirebaseConfig(): FirebaseOptions {
  const currentEnv = (getEnv('VITE_APP_ENV') || getEnv('MODE') || 'development') as 'development' | 'staging' | 'production';
  return firebaseEnvironments[currentEnv] || firebaseEnvironments.development;
}

/**
 * Checks whether genuine, non-placeholder Firebase credentials are provided in the current environment.
 * Prevents Firebase Installations SDK from throwing 400 INVALID_ARGUMENT against Google's servers.
 */
export function hasRealFirebaseCredentials(): boolean {
  const envKey = getEnv('VITE_FIREBASE_API_KEY');
  if (!envKey) return false;
  if (
    envKey.includes('Placeholder') ||
    envKey.includes('LocalMAYF') ||
    envKey.includes('KeyMAYF') ||
    envKey.length < 30 ||
    !envKey.startsWith('AIzaSy')
  ) {
    return false;
  }
  return true;
}
