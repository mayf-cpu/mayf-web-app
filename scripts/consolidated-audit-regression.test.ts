import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path: string) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('audit history is not fabricated on process startup', () => {
  const source = read('src/lib/audit/auditLogger.ts');
  assert.match(source, /private logs: AuditLogEntry\[\] = \[\];/);
  assert.match(source, /public importState\(/);
  assert.match(source, /public exportState\(/);
  assert.doesNotMatch(source, /id: 'audit-101'/);
});

test('catalogue writes audit entries in the same atomic document commit', () => {
  const source = read('src/lib/cms/catalogueRepository.ts');
  assert.match(source, /collection: 'adminAuditLogs', state: auditLogService/);
  assert.match(source, /await db\.commit\(changes\)/);
  assert.match(source, /if \(write && db && !\(result as any\)\?\.failed\)/);
});

test('protected audit list and CSV query the persisted repository', () => {
  const server = read('server.ts');
  assert.match(server, /await catalogueRepository\.run\(\(\) => auditLogService\.getLogs\(/);
  assert.match(server, /await catalogueRepository\.run\(\(\) => auditLogService\.exportCsv\(category\)\)/);
});

test('administrator role change does not acknowledge success before audit commit', () => {
  const server = read('server.ts');
  const start = server.indexOf("app.post('/api/admin/admins/claim'");
  const end = server.indexOf('return res.json(', start);
  assert.ok(start >= 0 && end > start, 'admin claims route should exist');
  const route = server.slice(start, end);
  assert.match(route, /await adminSetCustomUserClaims\(/);
  assert.match(route, /await catalogueRepository\.run\(\(\) => \{/);
  assert.match(route, /auditLogService\.log\(/);
});
