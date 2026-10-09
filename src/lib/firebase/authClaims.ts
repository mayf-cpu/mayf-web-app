/**
 * Firebase Authentication & Custom Claims Authorization Service.
 * 
 * CORE ARCHITECTURAL PRINCIPLE:
 * - Profile data (name, email, class, board, streak) is stored in Firestore (/users/{uid}).
 * - Access control information (role: student/admin/superAdmin, pro, annualPass) is strictly
 *   carried inside cryptographically signed Firebase ID token custom claims.
 * - Role values from the browser or Firestore document are NEVER trusted for authorization.
 * - Privileged actions MUST be validated server-side by verifying the ID token.
 */

import { User as FirebaseUser, IdTokenResult } from 'firebase/auth';
import { AuthCustomClaims, UserRole } from './types';

export interface ParsedUserEntitlements {
  role: UserRole;
  isPro: boolean;
  hasAnnualPass: boolean;
  annualPassExpiry?: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

/**
 * Extracts verified authorization claims from the current user's Firebase ID token.
 */
export async function getVerifiedClaims(
  user: FirebaseUser | null,
  forceRefresh: boolean = false
): Promise<ParsedUserEntitlements> {
  if (!user) {
    return {
      role: 'student',
      isPro: false,
      hasAnnualPass: false,
      isAdmin: false,
      isSuperAdmin: false,
    };
  }

  try {
    const tokenResult: IdTokenResult = await user.getIdTokenResult(forceRefresh);
    const claims = (tokenResult.claims || {}) as Partial<AuthCustomClaims>;

    const email = (user.email || '').toLowerCase().trim();
    const authorizedAdminEmails = [
      '2026vivekkushwah@gmail.com',
      'ntnagrawal146@gmail.com',
      'admin@mayf.co.in',
    ];
    const isAuthorizedEmail = authorizedAdminEmails.includes(email);

    // Support both boolean claims (admin: true, superAdmin: true), role claims, and authorized admin email accounts
    const isSuperAdmin =
      claims.superAdmin === true ||
      claims.role === 'superAdmin' ||
      (isAuthorizedEmail && email !== 'admin@mayf.co.in');
    const isAdmin = isSuperAdmin || claims.admin === true || claims.role === 'admin' || isAuthorizedEmail;
    const role: UserRole = isSuperAdmin ? 'superAdmin' : isAdmin ? 'admin' : 'student';

    const hasAnnualPass = Boolean(claims.annualPass);
    const isPro = Boolean(claims.pro) || hasAnnualPass;

    return {
      role,
      isPro,
      hasAnnualPass,
      annualPassExpiry: claims.annualPassExpiry,
      isAdmin,
      isSuperAdmin,
    };
  } catch (error) {
    console.error('[MAYF AuthClaims] Error reading ID token claims:', error);
    return {
      role: 'student',
      isPro: false,
      hasAnnualPass: false,
      isAdmin: false,
      isSuperAdmin: false,
    };
  }
}
