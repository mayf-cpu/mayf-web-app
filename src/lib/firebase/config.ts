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

export const firebaseEnvironments: Record<'development' | 'staging' | 'production', FirebaseOptions> = {
  development: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDevPlaceholderKeyForLocalMAYF',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'mayf-dev.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'mayf-dev',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'mayf-dev.appspot.com',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '100000000001',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:100000000001:web:dev000000000000',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-DEV0000000',
    appCheckSiteKey: import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY,
  },
  staging: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyStagingPlaceholderKeyMAYF',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'mayf-staging.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'mayf-staging',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'mayf-staging.appspot.com',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '200000000002',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:200000000002:web:staging00000000',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-STAGING000',
    appCheckSiteKey: import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY,
  },
  production: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyProdPlaceholderKeyMAYF',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'mayf-prod.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'mayf-prod',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'mayf-prod.appspot.com',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '300000000003',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:300000000003:web:prod0000000000',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-PROD000000',
    appCheckSiteKey: import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY,
  },
};

export function getActiveFirebaseConfig(): FirebaseOptions {
  const currentEnv = (import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'development') as 'development' | 'staging' | 'production';
  return firebaseEnvironments[currentEnv] || firebaseEnvironments.development;
}
