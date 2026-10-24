import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

/** Create only the owner's named empty production R2 bucket; never expose it publicly. */
export async function provisionProductionBucket({ token, accountId, request = fetch }) {
  if (!token || !/^[a-f0-9]{32}$/i.test(accountId || '')) throw Error('Cloudflare deployment credentials unavailable');
  const root = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets`;
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
  const options = { headers, redirect: 'manual', signal: AbortSignal.timeout(10000) };
  const exists = await request(root + '/mayf-study-materials', { ...options, method: 'GET' });
  if (exists.ok) {
    const data = await exists.json();
    if (data.success !== true || data.result?.name !== 'mayf-study-materials') throw Error('Production bucket metadata mismatch');
    return { bucket: 'mayf-study-materials', created: false };
  }
  if (exists.status !== 404) throw Error('Production bucket preflight failed (HTTP ' + exists.status + ')');
  const created = await request(root, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'mayf-study-materials' }), redirect: 'manual', signal: AbortSignal.timeout(10000) });
  if (!created.ok) throw Error('Production bucket creation failed (HTTP ' + created.status + ')');
  const result = await created.json();
  if (result.success !== true || result.result?.name !== 'mayf-study-materials') throw Error('Production bucket creation was not acknowledged');
  return { bucket: 'mayf-study-materials', created: true };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(await provisionProductionBucket({ token: process.env.CLOUDFLARE_API_TOKEN, accountId: process.env.CLOUDFLARE_ACCOUNT_ID }))); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
