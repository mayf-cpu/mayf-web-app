/** Compare exact deployment hosts; never trust an arbitrary workers.dev origin. */
export function isAllowedRequestOrigin(origin: string, requestHost: string | undefined): boolean {
  try {
    const url = new URL(origin);
    if (url.username || url.password) return false;
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) return false;
    return url.host.toLowerCase() === requestHost?.toLowerCase()
      || (url.protocol === 'https:' && url.port === '' && (url.hostname === 'mayf.co.in' || url.hostname.endsWith('.mayf.co.in')))
      || (process.env.NODE_ENV !== 'production' && local);
  } catch { return false; }
}
