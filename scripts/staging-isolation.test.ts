import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
test('staging configuration remains isolated from production', () => {
 assert.doesNotThrow(()=>execFileSync(process.execPath,['scripts/check-staging-isolation.mjs']));
 const wrangler=JSON.parse(readFileSync(new URL('../wrangler.staging.jsonc',import.meta.url),'utf8'));
 assert.equal(wrangler.name,'mayf-staging');
 assert.equal(wrangler.r2_buckets[0].bucket_name,'mayf-staging-files');
 assert.equal(wrangler.vars.MAYF_ENABLE_ADMIN_REFUNDS,'false');
 assert.deepEqual(Object.keys(wrangler.vars).sort(),['APP_ENV','MAYF_ENABLE_CHECKOUT','MAYF_ENABLE_ADMIN_REFUNDS','MAYF_ENABLE_COUPON_CHECKOUT','MAYF_ENABLE_PAYMENT_SIMULATION'].sort());
 for (const key of ['route','routes','zone_id','env','services','d1_databases','kv_namespaces','unsafe','custom_domains','dispatch_namespaces','queues','durable_objects']) assert.equal(wrangler[key],undefined,`Unexpected staging binding: ${key}`);
});
test('manual workflow never targets production configuration', () => {
 const flow=readFileSync(new URL('../.github/workflows/deploy-staging.yml',import.meta.url),'utf8');
 assert.ok(flow.includes('workflow_dispatch:'));
 assert.ok(flow.includes("github.ref_name == 'staging/consolidated-mayf-2026-10-21'"));
 assert.ok(flow.includes('inputs.confirm_isolated_staging == true'));
 assert.ok(flow.includes('wrangler.staging.jsonc'));
 assert.ok(!flow.includes('wrangler deploy --config wrangler.jsonc'));
});
