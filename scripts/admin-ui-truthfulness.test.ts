import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

test('admin import uses a real authenticated API and never simulates success', () => {
 const source = readFileSync(new URL('../src/components/admin/sections/AdminImportSection.tsx',import.meta.url),'utf8');
 assert.match(source, /fetch\('\/api\/admin\/ingest\/sync'/);
 assert.match(source, /headers: await adminService\.getAuthHeaders\(\)/);
 assert.match(source, /if \(!res\.ok \|\| data\.success !== true\)/);
 assert.doesNotMatch(source, /simulated catalog verified|64 chapters and formulas validated|1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/);
});
test('admin payment page does not create fake session tokens', () => {
 const source=readFileSync(new URL('../src/pages/AdminPaymentSettingsPage.tsx',import.meta.url),'utf8');
 assert.doesNotMatch(source,/admin-dev-session/);
 assert.match(source,/if \(!token\) throw new Error\('Administrator sign-in is required.'\)/);
});
test('social analytics never displays fabricated interaction counts', () => {
 const source=readFileSync(new URL('../src/components/admin/sections/AdminSocialSection.tsx',import.meta.url),'utf8');
 assert.doesNotMatch(source,/28,490|18,220|9,410|6,140|5,080 visits|2,260 visits|1,030 visits/);
 assert.match(source,/Not measured/);
});
