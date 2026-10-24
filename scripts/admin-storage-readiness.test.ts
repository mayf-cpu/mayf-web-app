import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
test('staging storage diagnostics are restricted to authenticated admins', () => {
  const source = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  assert.match(source, /app\.get\('\/api\/admin\/storage-readiness', requireAuth, requireAdmin/);
  assert.match(source, /'Cache-Control', 'no-store'/);
  const block = source.slice(source.indexOf("app.get('/api/admin/storage-readiness'"),source.indexOf("app.get('/api/admin/verify-access'"));
  assert.match(block, /Configuration-only check/);
  assert.doesNotMatch(block, /private_key|access_token|JSON\.stringify\(process\.env/);
});
