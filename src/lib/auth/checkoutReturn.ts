/** Keep enrollment intent in the URL, never in an auth token or payment state. */
export const ANNUAL_PASS_CHECKOUT = '/checkout?plan=annual-pass';

export function safeCheckoutReturn(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048 || /[\\\u0000-\u001f\u007f]/.test(value)) return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  try {
    const url = new URL(value, 'https://mayf.invalid');
    if (url.origin !== 'https://mayf.invalid' || url.pathname !== '/checkout') return null;
    return url.pathname + url.search;
  } catch { return null; }
}

export function checkoutLoginUrl(destination: string): string {
  return '/login?' + new URLSearchParams({returnTo: safeCheckoutReturn(destination) || ANNUAL_PASS_CHECKOUT});
}

export function hasCheckoutSession(firebaseUser: {uid?: string; isAnonymous?: boolean} | null, profile: {uid?: string} | null, production: boolean): boolean {
  return Boolean(firebaseUser?.uid && !firebaseUser.isAnonymous || !production && profile?.uid);
}

export function loginContinuation(loading: boolean, signedIn: boolean, returnTo: unknown, completedLoginFallback: string | null): string | null {
  if (loading || !signedIn) return null;
  return safeCheckoutReturn(returnTo) || completedLoginFallback;
}
