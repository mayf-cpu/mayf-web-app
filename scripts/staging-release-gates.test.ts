import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('release uses the real backend, not the bootstrap Worker', () => {
  const wrangler = JSON.parse(read('wrangler.jsonc'));
  assert.equal(wrangler.main, 'worker.ts');
  assert.ok(wrangler.assets.run_worker_first.includes('/api/*'));
});

test('private R2 and fail-closed PDF delivery remain wired', () => {
  const wrangler = JSON.parse(read('wrangler.jsonc'));
  assert.ok(wrangler.r2_buckets?.some((entry: any) => entry.binding === 'MAYF_PDF_BUCKET'));
  const server = read('server.ts');
  assert.match(server, /await resolveDownloadableItem\(getAdminFirestore\(\), contentId\)/);
  assert.ok(server.includes('readVerifiedPdf(tokenRecord.contentId, tokenRecord.objectKey)'));
  assert.match(server, /await tokens\.consume\(token, tokenRecord\)/);
  assert.match(server, /await getAuthoritativePassStatus\(tokenRecord\.uid\)/);
});

test('Drive ingest requires real PDF transfer and durable CMS commit', () => {
  const adapter = read('src/lib/ingestion/driveStorageAdapter.ts');
  assert.match(adapter, /await bucket\.put\(key, bytes/);
  assert.match(adapter, /await bucket\.head\(key\)/);
  const ingestion = read('src/lib/ingestion/ingestionService.ts');
  const transfer = ingestion.indexOf('await copyDriveFileToProductionStorage(');
  const commit = ingestion.indexOf('await db.commit([{', transfer);
  const success = ingestion.indexOf('// 4. Record successful Ingestion Job', transfer);
  assert.ok(transfer >= 0 && commit > transfer && success > commit);
  assert.match(ingestion, /importPublicationPolicy\(previous, existing\.exists, isPubliclyVisible\)/);
});

test('checkout remains explicitly disabled without enablement', () => {
  const server = read('server.ts');
  assert.match(server, /MAYF_ENABLE_CHECKOUT/);
});
