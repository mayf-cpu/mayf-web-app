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
if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
    url.pathname !== '/' || !url.hostname.endsWith('.workers.dev') ||
    url.hostname === 'mayf.co.in') {
  console.error('Expected an HTTPS Cloudflare preview Worker root URL (not production).');
  process.exit(2);
}
const check = async (path) => {
  const response = await fetch(new URL(path,url), {
    redirect: 'manual',
    headers: { Accept: 'application/json', 'Cache-Control': 'no-store' },
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
 '/api/admin/ingest/jobs','/api/admin/ingest/legacy-migration-audit']) {
  const response = await check(path);
  if (response.status !== 401 && response.status !== 403) {
    throw Error(path + ' must deny anonymous requests; got HTTP ' + response.status);
  }
  console.log('PASS: anonymous access denied to ' + path);
}
console.log('Read-only staging HTTP smoke checks passed.');
