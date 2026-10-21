#!/usr/bin/env node
/**
 * Read-only staging Cloudflare deployment preflight.
 * Checks metadata for the separate R2 bucket and an existing staging Worker
 * Firebase service-account binding. Never requests secret values or writes.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const staging = JSON.parse(readFileSync(new URL('../wrangler.staging.jsonc', import.meta.url), 'utf8'));
const production = JSON.parse(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));

export async function verifyStagingCloudflareResources({ token, accountId, request = fetch }) {
  if (!token || typeof token !== 'string') throw Error('Staging Cloudflare API token is missing');
  if (!/^[a-f0-9]{32}$/i.test(accountId || '')) throw Error('Staging Cloudflare account ID must be 32 hexadecimal characters');
  const worker = staging.name;
  const bucket = staging.r2_buckets?.[0]?.bucket_name;
  if (worker !== 'staging-acceptance-mayf' || worker === production.name ||
      bucket !== 'mayf-staging-materials' || bucket === production.r2_buckets?.[0]?.bucket_name) {
    throw Error('Staging config no longer points to isolated Worker and R2 resources');
  }
  const getMetadata = async path => {
    const response = await request('https://api.cloudflare.com/client/v4/accounts/' + accountId + path, {
      method: 'GET',
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
    });
    // Do not include provider response bodies, which could contain identifiers
    // or account metadata. A failed API request is never equivalent to ready.
    if (!response.ok) throw Error('Staging Cloudflare metadata check failed (HTTP ' + response.status + ')');
    const data = await response.json();
    if (!data || data.success !== true) throw Error('Staging Cloudflare metadata response was unsuccessful');
    return data.result;
  };
  const r2 = await getMetadata('/r2/buckets/' + encodeURIComponent(bucket));
  if (r2?.name !== bucket) throw Error('Isolated staging R2 bucket is missing or mismatched');

  const secrets = await getMetadata('/workers/scripts/' + encodeURIComponent(worker) + '/secrets');
  const names = new Set(Array.isArray(secrets) ? secrets.map(secret => secret.name) : []);
  if (!names.has('FIREBASE_SERVICE_ACCOUNT_JSON')) {
    throw Error('Existing staging Worker is missing FIREBASE_SERVICE_ACCOUNT_JSON binding; bootstrap staging secrets before deployment');
  }
  return { worker, bucket, serviceAccountBindingPresent: true };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await verifyStagingCloudflareResources({
      token: process.env.CLOUDFLARE_API_TOKEN,
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    });
    console.log('PASS: isolated Cloudflare Worker secret metadata and private staging R2 bucket exist');
    console.log('Staging Worker: ' + result.worker + '; bucket: ' + result.bucket);
    console.log('Note: credentials, runtime Firestore/Drive access, and student downloads still need authenticated acceptance.');
  } catch (error) {
    console.error('BLOCKED: ' + (error instanceof Error ? error.message : 'Cloudflare staging resources unavailable'));
    process.exitCode = 1;
  }
}
