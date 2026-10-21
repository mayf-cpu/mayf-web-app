import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
const read = (name:string) => readFileSync(new URL('../' + name, import.meta.url), 'utf8');

test('import transition paths persist before reporting rejected, failed or imported', () => {
  const src=read('src/lib/ingestion/ingestionService.ts');
  assert.match(src,/await saveIngestionJob\(rejectedJob\)/);
  assert.match(src,/await saveIngestionJob\(failedJob\)/);
  assert.match(src,/await saveIngestionJob\(successfulJob\)/);
  assert.match(src,/await saveIngestionJob\(failed\)/);
});
test('admin and webhook load authoritative job status from Firestore', () => {
  const src=read('server.ts');
  const jobs=src.slice(src.indexOf("app.get('/api/admin/ingest/jobs'"),src.indexOf("app.post('/api/admin/ingest/retry'"));
  assert.match(jobs,/await refreshIngestionJobs\(\)/);
  assert.match(src,/await refreshIngestionJobs\(\);\n    const updatedJob = await retryIngestionJob/);
  assert.match(src,/await refreshIngestionJobs\(\);\n    const syncOutcome = await syncRegistryNow/);
});
