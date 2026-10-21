import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
test('retry records actual errors without losing failed job state', () => {
  const src=readFileSync(new URL('../src/lib/ingestion/ingestionService.ts',import.meta.url),'utf8');
  const i=src.indexOf('export async function retryIngestionJob('),j=src.indexOf('export async function syncRegistryNow(',i);
  const retry=src.slice(i,j);
  assert.match(retry,/catch \(error\)/);
  assert.match(retry,/failed\.status = 'failed'/);
  assert.match(retry,/failed\.errorMessage = error instanceof Error/);
  assert.match(retry,/import_status: 'FAILED'/);
  assert.doesNotMatch(retry,/RECOVERED_VALID_FILE/);
});
