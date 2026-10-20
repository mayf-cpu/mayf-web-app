import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';

test('Drive ingestion commits CMS content before reporting success', () => {
  const source = readFileSync(new URL('../src/lib/ingestion/ingestionService.ts', import.meta.url), 'utf8');
  const transfer = source.indexOf('const storageResult = await copyDriveFileToProductionStorage(');
  const persisted = source.indexOf('await db.commit([{', transfer);
  const success = source.indexOf('// 4. Record successful Ingestion Job', transfer);
  assert.ok(transfer >= 0 && persisted > transfer && success > persisted,
    'upload must finish and CMS commit must succeed before import success');
  assert.match(source, /status: isPubliclyVisible \? 'published' : 'hidden'/);
  assert.match(source, /\.\.\.\(existing\.updateTime \? \{ updateTime: existing\.updateTime \} : \{\}\)/);
});
