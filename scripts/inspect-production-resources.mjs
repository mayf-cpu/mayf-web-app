import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

/** Read-only, allowlisted metadata. Never reads or prints secret values. */
export async function inspectProductionResources({ token, accountId, request = fetch }) {
  if (!token || !/^[a-f0-9]{32}$/i.test(accountId || '')) throw Error('Cloudflare metadata credentials unavailable');
  const get = async path => {
    const response = await request(`https://api.cloudflare.com/client/v4/accounts/${accountId}${path}`, {
      method: 'GET', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      redirect: 'manual', signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return { status: response.status, result: null };
    const data = await response.json();
    return { status: data.success === true ? 200 : 502, result: data.success === true ? data.result : null };
  };
  const [worker, secrets, bucket, domains] = await Promise.all([
    get('/workers/scripts/mayf/settings'), get('/workers/scripts/mayf/secrets'),
    get('/r2/buckets/mayf-study-materials'), get('/workers/domains'),
  ]);
  const bindings = Array.isArray(worker.result?.bindings) ? worker.result.bindings : [];
  const names = new Set(Array.isArray(secrets.result) ? secrets.result.map(value => value.name) : []);
  const domainList = Array.isArray(domains.result) ? domains.result : [];
  return {
    worker: 'mayf', metadataStatus: worker.status,
    productionBucketPresent: bucket.result?.name === 'mayf-study-materials', bucketMetadataStatus: bucket.status,
    r2BindingMatches: bindings.some(value => value.type === 'r2_bucket' && value.name === 'MAYF_PDF_BUCKET' && value.bucket_name === 'mayf-study-materials'),
    requiredSecretPresence: Object.fromEntries(['FIREBASE_SERVICE_ACCOUNT_JSON', 'GEMINI_API_KEY', 'TURNSTILE_SECRET_KEY'].map(name => [name, names.has(name)])),
    domainMetadataStatus: domains.status,
    domains: domainList.filter(value => ['mayf.co.in', 'www.mayf.co.in'].includes(value.hostname)).map(value => ({ hostname: value.hostname, service: value.service, environment: value.environment })),
  };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(await inspectProductionResources({ token: process.env.CLOUDFLARE_API_TOKEN, accountId: process.env.CLOUDFLARE_ACCOUNT_ID }), null, 2)); }
  catch { console.error('Production metadata inspection unavailable. No production resources were changed.'); process.exitCode = 1; }
}
