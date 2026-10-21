import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const production = JSON.parse(readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
const staging = JSON.parse(readFileSync(new URL('../wrangler.staging.jsonc',import.meta.url),'utf8'));
assert.notEqual(staging.name,production.name,'Staging Worker must be separate');
assert.equal(staging.name,'mayf-staging-acceptance');
assert.equal(staging.main,'worker.ts');
assert.deepEqual(staging.assets.run_worker_first,['/api/*']);
assert.equal(staging.r2_buckets?.length,1);
assert.equal(staging.r2_buckets[0].binding,'MAYF_PDF_BUCKET');
assert.equal(staging.r2_buckets[0].bucket_name,'mayf-staging-materials');
assert.notEqual(staging.r2_buckets[0].bucket_name,production.r2_buckets?.[0]?.bucket_name);
assert.equal(staging.routes,undefined,'Staging must not attach production routes');
assert.equal(staging.routes,undefined);
