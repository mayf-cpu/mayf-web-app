/**
 * Environment configuration for Maths at Your Fingertips (MAYF)
 * Supports development, staging, and production tiers.
 * 
 * IMPORTANT: Only client-safe variables (prefixed with VITE_) are exposed here.
 * Server secrets (GEMINI_API_KEY, TURNSTILE_SECRET_KEY, FIREBASE_ADMIN_PRIVATE_KEY)
 * are restricted exclusively to server-side Node.js execution.
 */

export type AppEnvironment = 'development' | 'staging' | 'production';

export interface ClientAppConfig {
  env: AppEnvironment;
  appName: string;
  domain: string;
  apiBaseUrl: string;
  turnstile: {
    siteKey: string;
    enabled: boolean;
  };
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
    appCheckSiteKey: string;
  };
}

const getEnvMode = (): AppEnvironment => {
  const mode = import.meta.env.VITE_APP_ENV || import.meta.env.MODE;
  if (mode === 'production') return 'production';
  if (mode === 'staging') return 'staging';
  return 'development';
};

const currentEnv = getEnvMode();

export const clientConfig: ClientAppConfig = {
  env: currentEnv,
  appName: 'Maths at Your Fingertips',
  domain: 'https://mayf.co.in',
  apiBaseUrl: '/api',
  turnstile: {
    siteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA',
    enabled: Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY),
  },
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'dev_api_key_placeholder',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'mayf-dev.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'mayf-dev',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'mayf-dev.appspot.com',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '100000000001',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:100000000001:web:dev000000000000',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-DEV0000000',
    appCheckSiteKey: import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY || 'dev_app_check_key',
  },
};
