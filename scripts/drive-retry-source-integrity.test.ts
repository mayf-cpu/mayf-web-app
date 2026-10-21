import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';

test('retry import never fabricates or replaces a Google Drive file ID', () => {
  const source = readFileSync(new URL('../src/lib/ingestion/ingestionService.ts', import.meta.url), 'utf8');
  const start = source.indexOf('export async function retryIngestionJob(');
  const end = source.indexOf('export async function syncRegistryNow(', start);
  assert.ok(start >= 0 && end > start);
  const retry = source.slice(start, end);
  assert.doesNotMatch(retry, /RECOVERED_VALID_FILE|drive_file_id\s*=/);
  assert.match(retry, /processRegistryRow\(job\.sourceRowMetadata, 'admin_retry'\)/);
});
