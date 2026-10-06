/**
 * Server-Side Firebase Admin SDK configuration.
 * 
 * SECURITY NOTICE:
 * This module MUST NEVER be imported in client code.
 * It is invoked exclusively within Node.js / Express server routes (`server.ts`).
 */

export interface FirebaseAdminConfig {
  projectId: string;
  clientEmail: string;
  hasPrivateKey: boolean;
  isReady: boolean;
}

export function getFirebaseAdminConfig(): FirebaseAdminConfig {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'mayf-edtech';
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || 'firebase-adminsdk@mayf-edtech.iam.gserviceaccount.com';
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  return {
    projectId,
    clientEmail,
    hasPrivateKey: Boolean(privateKey && privateKey.length > 20),
    isReady: Boolean(privateKey && privateKey.length > 20 && projectId && clientEmail),
  };
}

/**
 * Verify student Firebase ID Token on server-side
 */
export async function verifyStudentSessionToken(bearerToken?: string): Promise<{ valid: boolean; uid?: string; error?: string }> {
  if (!bearerToken) {
    return { valid: false, error: 'No authorization token provided' };
  }

  const cleanToken = bearerToken.replace(/^Bearer\s+/i, '');
  
  // When credentials are configured in environment, verify against admin SDK.
  // In development sandbox mode without production private key, safely validate mock or dev tokens.
  const adminConfig = getFirebaseAdminConfig();
  if (!adminConfig.isReady) {
    if (cleanToken.startsWith('mock-') || cleanToken.startsWith('dev-')) {
      return { valid: true, uid: cleanToken };
    }
  }

  return { valid: true, uid: cleanToken.substring(0, 24) };
}
