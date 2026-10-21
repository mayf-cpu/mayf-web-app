#!/usr/bin/env node
/**
 * Explicit, read-only staging check.
 * Usage: node scripts/staging-http-smoke.mjs https://preview.example.workers.dev
 * Never run this against production; this script intentionally uses no credentials.
 */
const supplied = process.argv[2];
if (!supplied) {
  console.error('Usage: node scripts/staging-http-smoke.mjs https://YOUR-STAGING-WORKER');
  process.exit(2);
}
const url = new URL(supplied);
// The production Worker also lives under workers.dev. Require an unmistakable
// preview name, never a plain Worker production hostname.
const workerName = url.hostname.split('.')[0];
const previewHostname = /^[a-z0-9-]+-mayf$/.test(workerName) && workerName !== 'mayf';
if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
    url.pathname !== '/' || !url.hostname.endsWith('.workers.dev') ||
    url.hostname === 'mayf.co.in' || !previewHostname) {
  console.error('Expected an HTTPS MAYF preview hostname (<branch>-mayf.<account>.workers.dev), not a production Worker.');
  process.exit(2);
}
const check = async (path, token) => {
  const response = await fetch(new URL(path,url), {
    redirect: 'manual',
    headers: { Accept: 'application/json', 'Cache-Control': 'no-store',
      ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    signal: AbortSignal.timeout(15000),
  });
  const type = response.headers.get('content-type') || '';
  if (!type.includes('application/json')) throw Error(path + ' did not return JSON');
  const body = await response.json();
  return { status: response.status, body };
};
const health = await check('/api/health');
if (health.status !== 200 || health.body.status !== 'ok' ||
    health.body.app !== 'Maths at Your Fingertips') {
  throw Error('Staging health endpoint failed');
}
console.log('PASS: backend health responds as MAYF JSON');
for (const path of ['/api/admin/verify-access','/api/admin/storage-readiness',
 '/api/admin/ingest/jobs','/api/admin/ingest/legacy-migration-audit',
 '/api/admin/staging-connectivity']) {
  const response = await check(path);
  if (response.status !== 401 && response.status !== 403) {
    throw Error(path + ' must deny anonymous requests; got HTTP ' + response.status);
  }
  console.log('PASS: anonymous access denied to ' + path);
}
console.log('Read-only staging HTTP smoke checks passed.');

const adminToken = process.env.MAYF_STAGING_ADMIN_TOKEN;
if (adminToken) {
  const access = await check('/api/admin/verify-access', adminToken);
  if (access.status !== 200 || access.body.authorized !== true) {
    throw Error('Authenticated staging Admin access verification failed');
  }
  console.log('PASS: authenticated Admin access verified');
  const diagnostics = await check('/api/admin/storage-readiness', adminToken);
  if (diagnostics.status !== 200 || diagnostics.body.success !== true) {
    throw Error('Staging storage readiness diagnostics failed');
  }
  const checks = diagnostics.body.readiness;
  const required = ['firestoreConfigured','privateR2BucketBound',
    'privateR2UploadSupported','googleServiceAccountPresent','verifiedPdfImportAvailable'];
  for (const name of required) {
    if (checks?.[name] !== true) {
      throw Error('Staging prerequisite unavailable: ' + name);
    }
    console.log('PASS: staging prerequisite ' + name);
  }
  const probe = await check('/api/admin/staging-connectivity', adminToken);
  if (probe.status !== 200 || probe.body.success !== true ||
      probe.body.connectivity?.firestore !== 'reachable' ||
      probe.body.connectivity?.r2 !== 'reachable') {
    throw Error('Staging Firestore/R2 read-only connectivity check failed');
  }
  console.log('PASS: Firestore and R2 read-only API connectivity');
  console.log('Configuration presence verified; Drive OAuth, uploads and payments remain untested.');
} else {
  console.log('SKIP: authenticated readiness (set MAYF_STAGING_ADMIN_TOKEN securely to check)');
}
