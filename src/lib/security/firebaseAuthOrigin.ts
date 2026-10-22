/** Exact HTTPS auth-helper origin for CSP; never interpolate unchecked environment text. */
export function firebaseAuthOrigin(options: {
  authDomain?: string; staging: boolean; projectId: string; productionAuthDomain: string;
}): string {
  const hostname = options.authDomain || (options.staging ? `${options.projectId}.firebaseapp.com` : options.productionAuthDomain);
  if (!hostname || hostname.length > 253 || !/^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/.test(hostname)) {
    throw new Error('Firebase authDomain must be a hostname without a scheme, path or CSP directives');
  }
  return 'https://' + hostname.toLowerCase();
}
