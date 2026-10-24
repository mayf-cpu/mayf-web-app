import { readFileSync } from 'node:fs';
import { inspectProductionResources } from './inspect-production-resources.mjs';
const config = JSON.parse(readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
if (config.name !== 'mayf' || config.vars?.APP_ENV !== 'production' || config.vars?.PUBLIC_APP_URL !== 'https://mayf.co.in' ||
    config.r2_buckets?.[0]?.bucket_name !== 'mayf-study-materials' || config.r2_buckets?.[0]?.binding !== 'MAYF_PDF_BUCKET' ||
    ['MAYF_ENABLE_CHECKOUT','MAYF_ENABLE_ADMIN_REFUNDS','MAYF_ENABLE_COUPON_CHECKOUT','MAYF_ENABLE_PAYMENT_SIMULATION'].some(key => config.vars[key] !== 'false')) throw Error('Production configuration drifted from the reviewed disabled-commerce release');
if (process.env.VITE_APP_ENV !== 'production' || process.env.VITE_FIREBASE_PROJECT_ID !== 'maths-at-your-fingertips') throw Error('Production Firebase identity mismatch');
for (const key of ['VITE_FIREBASE_API_KEY','VITE_FIREBASE_AUTH_DOMAIN','VITE_FIREBASE_STORAGE_BUCKET','VITE_FIREBASE_MESSAGING_SENDER_ID','VITE_FIREBASE_APP_ID','VITE_TURNSTILE_SITE_KEY']) {
  if (!process.env[key]?.trim() || /placeholder|demo-key/i.test(process.env[key])) throw Error('Missing production frontend configuration: ' + key);
}
const result = await inspectProductionResources({token:process.env.CLOUDFLARE_API_TOKEN,accountId:process.env.CLOUDFLARE_ACCOUNT_ID});
const missing = Object.entries(result.requiredSecretPresence).filter(([,present]) => !present).map(([name]) => name);
if (result.metadataStatus !== 200 || !result.productionBucketPresent || missing.length ||
    !result.domains.some(domain => domain.hostname === 'mayf.co.in' && domain.service === 'mayf')) {
  throw Error('Production provisioning incomplete. Missing Worker secrets: ' + missing.join(', ') + '; bucket ready: ' + result.productionBucketPresent + '; Worker metadata status: ' + result.metadataStatus);
}
console.log('PASS: production configuration, private bucket, domain mapping and required secret names verified. Secret values were not read.');
