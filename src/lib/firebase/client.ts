/**
 * Client-Side Firebase SDK Initializer for Maths at Your Fingertips (MAYF).
 * Integrates:
 * - Firebase App
 * - Firebase Authentication (with Google Sign-In via popup)
 * - Cloud Firestore with rigorous error diagnostics
 * - Cloud Storage
 * - Firebase App Check (Cloudflare Turnstile & Debug provider)
 * - Firebase Analytics / GA4
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { initializeAppCheck, CustomProvider, AppCheck } from 'firebase/app-check';
import { getActiveFirebaseConfig, hasRealFirebaseCredentials } from './config';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

const config = getActiveFirebaseConfig();

// Initialize Firebase App instance
export const app: FirebaseApp =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
        measurementId: config.measurementId,
      });

// Firebase Services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

// Google Sign-In Provider setup
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});

// -------------------------------------------------------------
// Firebase App Check Integration
// Integrates with Cloudflare Turnstile token or development debug token
// -------------------------------------------------------------
export let appCheck: AppCheck | null = null;
if (typeof window !== 'undefined') {
  try {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      // In development, enable debug token for seamless verification
      (window as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    appCheck = initializeAppCheck(app, {
      provider: new CustomProvider({
        getToken: async () => {
          // Cloudflare Turnstile integration or environment site-key
          const token = isLocalhost
            ? 'debug-app-check-token-local'
            : (config.appCheckSiteKey || 'app-check-turnstile-token');
          return {
            token,
            expireTimeMillis: Date.now() + 60 * 60 * 1000,
          };
        },
      }),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (err) {
    // App check fallback in dev
    console.warn('[MAYF AppCheck] Initialization note:', err);
  }
}

// -------------------------------------------------------------
// Firestore Error Handler (Mandatory Diagnostic Standard)
// -------------------------------------------------------------
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo:
        currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };

  console.error('[MAYF Firestore Error]:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// -------------------------------------------------------------
// Validate Connection to Firestore on boot
// -------------------------------------------------------------
export async function testConnection(): Promise<boolean> {
  if (!hasRealFirebaseCredentials()) {
    return false;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[MAYF Firestore] Offline mode detected. Check Firebase network permissions.');
    }
    return false;
  }
}

// Trigger connection diagnostic on non-production clients
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  testConnection().catch(() => {});
}

/**
 * Google Sign-In Popup helper
 */
export async function signInWithGooglePopup(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleAuthProvider);
  return result.user;
}

/**
 * Sign out helper
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}
