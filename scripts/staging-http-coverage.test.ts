import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const smoke = readFileSync(new URL('./staging-http-smoke.mjs',import.meta.url),'utf8');
test('staging read-only acceptance fails closed on production runtime or enabled checkout',()=>{
 assert.match(smoke,/health\.body\.environment !== 'staging'/);
 assert.match(smoke,/pass\.body\.checkoutEnabled !== false/);
 assert.match(smoke,/\.workers\.dev/);
 assert.match(smoke,/MAYF_STAGING_ADMIN_TOKEN/);
});
test('staging smoke checks protected modules without mutation methods',()=>{
 for (const route of ['/api/admin/ingest/config','/api/admin/seo','/api/admin/content',
 '/api/admin/categories','/api/admin/analytics/dashboard?timeframe=30d',
 '/api/admin/annual-pass/settings','/api/admin/payments/settings',
 '/api/admin/orders','/api/admin/students']) assert.ok(smoke.includes(route),route);
 assert.doesNotMatch(smoke,/method:\s*['"](?:POST|PUT|DELETE|PATCH)['"]/);
 assert.match(smoke,/response\.status !== 200/);
});
