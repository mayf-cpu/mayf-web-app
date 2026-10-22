import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const workflow = readFileSync(new URL('../.github/workflows/deploy-staging.yml',import.meta.url),'utf8');
test('staging deploy checks required credentials before deployment',()=>{
 const gate=workflow.indexOf('Require staging-only deployment credentials');
 const deploy=workflow.indexOf('Deploy ONLY isolated staging Worker');
 assert.ok(gate>=0 && deploy>gate);
 for(const item of ['MAYF_STAGING_CLOUDFLARE_API_TOKEN','MAYF_STAGING_CLOUDFLARE_ACCOUNT_ID','MAYF_STAGING_FIREBASE_PROJECT_ID']) assert.ok(workflow.includes(item));
 assert.ok(workflow.includes("MAYF_ALLOW_SHARED_DEVELOPMENT_FIREBASE: 'true'"));
 assert.ok(workflow.includes('wrangler.staging.jsonc'));
});


test('only the consolidated candidate can be explicitly dispatched for isolated staging', () => {
 assert.match(workflow, /if: github\.ref_name == 'staging\/consolidated-mayf-2026-10-21'/);
 assert.match(workflow, /inputs\.confirm_isolated_staging == true/);
 assert.match(workflow, /STAGING_CONFIRM.*inputs\.confirm_isolated_staging/);
 assert.ok(!workflow.includes("if: github.ref_name == 'staging/integrated-acceptance-2026-10-21'"));
 assert.match(workflow, /test "\$STAGING_CONFIRM" = "true"/);
 assert.ok(!workflow.includes('push:'));
});

test('Cloudflare staging resource preflight runs before any deploy', () => {
 const preflight = workflow.indexOf('Verify Cloudflare staging R2 and service-account binding (read-only)');
 const deploy = workflow.indexOf('Deploy ONLY isolated staging Worker');
 assert.ok(preflight >= 0 && deploy > preflight);
 assert.match(workflow, /node scripts\/check-staging-cloudflare-resources\.mjs/);
 assert.match(workflow, /CLOUDFLARE_API_TOKEN:.*MAYF_STAGING_CLOUDFLARE_API_TOKEN/);
});

test('staging deployment fails closed before building a frontend with wrong Firebase config', () => {
 const guard = workflow.indexOf('Verify isolated staging frontend Firebase configuration');
 const build = workflow.indexOf('Build frontend with isolated staging Firebase configuration');
 const deploy = workflow.indexOf('Deploy ONLY isolated staging Worker');
 assert.ok(guard >= 0 && build > guard && deploy > build);
 assert.match(workflow, /node scripts\/check-staging-frontend-env\.mjs/);
 for (const key of ['VITE_APP_ENV: staging','VITE_FIREBASE_PROJECT_ID','VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN','VITE_FIREBASE_STORAGE_BUCKET','VITE_FIREBASE_MESSAGING_SENDER_ID','VITE_FIREBASE_APP_ID',
  'MAYF_STAGING_FIREBASE_PROJECT_ID']) assert.ok(workflow.includes(key), key);
 assert.ok(!workflow.includes('      - run: npm run build'));
});

test('manual staging deploy runs the same production audit and Firestore security emulator gates as PR CI', () => {
 const audit = workflow.indexOf('npm audit --omit=dev --audit-level=high');
 const rules = workflow.indexOf('npm run test:rules');
 const deploy = workflow.indexOf('Deploy ONLY isolated staging Worker');
 assert.ok(audit >= 0 && rules > audit && deploy > rules);
 assert.match(workflow,/actions\/setup-java@v4/);
 assert.match(workflow,/java-version: '21'/);
});
