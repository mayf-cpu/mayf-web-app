import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
test('staging configuration remains isolated from production', () => {
 assert.doesNotThrow(()=>execFileSync(process.execPath,['scripts/check-staging-isolation.mjs']));
 const wrangler=JSON.parse(readFileSync(new URL('../wrangler.staging.jsonc',import.meta.url),'utf8'));
 assert.equal(wrangler.name,'staging-acceptance-mayf');
 assert.equal(wrangler.r2_buckets[0].bucket_name,'mayf-staging-materials');
});
test('manual workflow never targets production configuration', () => {
 const flow=readFileSync(new URL('../.github/workflows/deploy-staging.yml',import.meta.url),'utf8');
 assert.ok(flow.includes('workflow_dispatch:'));
 assert.ok(flow.includes("github.ref_name == 'staging/integrated-acceptance-2026-10-21'"));
 assert.ok(flow.includes('wrangler.staging.jsonc'));
 assert.ok(!flow.includes('wrangler deploy --config wrangler.jsonc'));
});
