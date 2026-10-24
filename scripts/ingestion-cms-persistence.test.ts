import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';

test('Drive ingestion commits CMS content before reporting success', () => {
  const source = readFileSync(new URL('../src/lib/ingestion/ingestionService.ts', import.meta.url), 'utf8');
  const transfer = source.indexOf('const storageResult = await copyDriveFileToProductionStorage(');
  const preflight = source.indexOf("const existing = await db.collection('contentItems').doc(firestoreId).get()");
  assert.ok(preflight >= 0 && preflight < transfer, 'CMS check must precede R2 transfer');
  const persisted = source.indexOf('await db.commit([{', transfer);
  const success = source.indexOf('// 4. Record successful Ingestion Job', transfer);
  assert.ok(transfer >= 0 && persisted > transfer && success > persisted,
    'upload must finish and CMS commit must succeed before import success');
  assert.match(source, /importPublicationPolicy\(previous, existing\.exists, isPubliclyVisible\)/);
  assert.match(source, /\.\.\.publication,/);
  assert.match(source, /\.\.\.\(existing\.updateTime \? \{ updateTime: existing\.updateTime \} : \{\}\)/);
});
