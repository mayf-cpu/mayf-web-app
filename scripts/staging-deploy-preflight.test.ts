import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const workflow = readFileSync(new URL('../.github/workflows/deploy-staging.yml',import.meta.url),'utf8');
test('staging deploy checks required credentials before deployment',()=>{
 const gate=workflow.indexOf('Require staging-only deployment credentials');
 const deploy=workflow.indexOf('Deploy ONLY isolated staging Worker');
 assert.ok(gate>=0 && deploy>gate);
 for(const item of ['MAYF_STAGING_CLOUDFLARE_API_TOKEN','MAYF_STAGING_CLOUDFLARE_ACCOUNT_ID','MAYF_STAGING_FIREBASE_PROJECT_ID']) assert.ok(workflow.includes(item));
 assert.ok(workflow.includes('Do not use the production Firebase project'));
 assert.ok(workflow.includes('wrangler.staging.jsonc'));
});
