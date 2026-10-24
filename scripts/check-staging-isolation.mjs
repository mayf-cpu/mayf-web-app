import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const production = JSON.parse(readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
const staging = JSON.parse(readFileSync(new URL('../wrangler.staging.jsonc',import.meta.url),'utf8'));
assert.notEqual(staging.name,production.name,'Staging Worker must be separate');
assert.equal(staging.name,'staging-acceptance-mayf');
assert.equal(staging.main,'worker.ts');
assert.deepEqual(staging.assets.run_worker_first,['/api/*']);
assert.equal(staging.r2_buckets?.length,1);
assert.equal(staging.r2_buckets[0].binding,'MAYF_PDF_BUCKET');
assert.equal(staging.r2_buckets[0].bucket_name,'mayf-staging-materials');
assert.notEqual(staging.r2_buckets[0].bucket_name,production.r2_buckets?.[0]?.bucket_name);
assert.equal(staging.routes,undefined,'Staging must not attach production routes');
assert.equal(staging.vars?.APP_ENV,'staging');
assert.equal(staging.vars?.PUBLIC_APP_URL,'https://staging-acceptance-mayf.sachinagrawal16.workers.dev','Staging callbacks must never advertise the production host');
assert.equal(staging.vars?.MAYF_ENABLE_CHECKOUT,'false');
assert.equal(staging.vars?.MAYF_ENABLE_COUPON_CHECKOUT,'false');
assert.equal(staging.vars?.MAYF_ENABLE_PAYMENT_SIMULATION,'false');
assert.equal(staging.triggers,undefined,'Staging must not run scheduled triggers');

// Fail closed if future configuration edits accidentally enable commerce, privileged
// refunds, custom domains or other production-facing bindings in staging.
assert.equal(staging.vars?.MAYF_ENABLE_ADMIN_REFUNDS,'false');
assert.equal(staging.workers_dev,undefined,'Staging worker URL must remain managed by isolated Wrangler config');
assert.equal(staging.route,undefined,'Staging must not attach a custom route');
assert.equal(staging.zone_id,undefined,'Staging must not attach a production zone');
assert.equal(staging.env,undefined,'Staging must not silently inherit environment overrides');
assert.equal(staging.services,undefined,'Staging must not bind production Workers');
assert.equal(staging.d1_databases,undefined,'Staging must not bind unreviewed D1 databases');
assert.equal(staging.kv_namespaces,undefined,'Staging must not bind unreviewed KV namespaces');
assert.equal(staging.unsafe,undefined,'Staging must not contain unsafe Worker bindings');

const approvedStagingFlags = [
  'APP_ENV',
  'PUBLIC_APP_URL',
  'MAYF_ALLOW_SHARED_DEVELOPMENT_FIREBASE',
  'MAYF_ENABLE_CHECKOUT',
  'MAYF_ENABLE_ADMIN_REFUNDS',
  'MAYF_ENABLE_COUPON_CHECKOUT',
  'MAYF_ENABLE_PAYMENT_SIMULATION',
];
assert.deepEqual(
  Object.keys(staging.vars ?? {}).sort(),
  approvedStagingFlags.sort(),
  'Staging must not acquire unreviewed plain-text environment variables or flags',
);
assert.equal(staging.custom_domains,undefined,'Staging must not attach custom domains');
assert.equal(staging.dispatch_namespaces,undefined,'Staging must not bind dispatch namespaces');
assert.equal(staging.queues,undefined,'Staging must not bind queues');
assert.equal(staging.durable_objects,undefined,'Staging must not bind Durable Objects');

assert.equal(staging.vars?.MAYF_ALLOW_SHARED_DEVELOPMENT_FIREBASE,'true','Owner-approved shared development policy must be explicit');
