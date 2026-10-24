import crypto from 'node:crypto';
const cached = new Map<string, { token: string; expiresAt: number }>();
const pending = new Map<string, Promise<string>>();
/** Scoped service-account OAuth over HTTPS; credentials never enter a client payload. */
export async function getGoogleAccessToken(scopes: string[]): Promise<string> {
  let account: any = {};
  try { account = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}'); } catch { throw new Error('Service-account JSON is unreadable.'); }
  const email = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || account.client_email;
  const key = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || account.private_key || '').replace(/\\n/g, '\n');
  if (!email || !key) throw new Error('Google service-account credentials are not configured.');
  const cacheKey = `${email}:${[...scopes].sort().join(' ')}`;
  const previous = cached.get(cacheKey);
  if (previous && previous.expiresAt > Date.now()) return previous.token;
  const underway = pending.get(cacheKey);
  if (underway) return underway;
  const issueToken = async () => {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ iss: email, scope: scopes.join(' '), aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })).toString('base64url');
  const unsigned = `${header}.${payload}`;
  const assertion = `${unsigned}.${crypto.sign('RSA-SHA256', Buffer.from(unsigned), key).toString('base64url')}`;
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }), signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Google authorization failed (${response.status}). Check service-account permissions.`);
  const data = await response.json() as any;
  if (typeof data.access_token !== 'string' || !data.access_token) throw new Error('Google authorization returned no access token.');
  cached.set(cacheKey, { token: data.access_token, expiresAt: Date.now() + Math.max(1, Number(data.expires_in || 3600) - 60) * 1000 });
  return data.access_token as string;
  };
  const issuance = issueToken();
  pending.set(cacheKey, issuance);
  try { return await issuance; }
  finally { if (pending.get(cacheKey) === issuance) pending.delete(cacheKey); }
}
