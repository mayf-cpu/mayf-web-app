import test from 'node:test';
import assert from 'node:assert/strict';
import { copyDriveFileToProductionStorage } from '../src/lib/ingestion/driveStorageAdapter';
import { readRegistrySheet, writeRegistryResult } from '../src/lib/ingestion/registrySource';
import { processRegistryRow, verifyWebhookSecret, ingestionState } from '../src/lib/ingestion/ingestionService';
import { contentCmsManager } from '../src/lib/cms/contentManager';
import type { ContentRegistryRow } from '../src/lib/ingestion/types';

const tokenProvider = async () => 'test-only-oauth-token';
test('Drive import uploads actual source bytes and verifies the stored object', async t => {
  const pdf = '%PDF-1.7\nQA file'; let uploaded = false;
  t.mock.method(globalThis, 'fetch', async (source: any, init: any) => {
    const url = new URL(String(source));
    if (url.searchParams.has('fields')) return Response.json({ id: 'qa_drive_file_12345', name: 'qa.pdf', mimeType: 'application/pdf', size: String(pdf.length) });
    if (url.searchParams.get('alt') === 'media') return new Response(pdf);
    assert.equal(url.hostname, 'storage.googleapis.com');
    uploaded = true; assert.equal(Buffer.from(init.body).toString(), pdf);
    return Response.json({ name: url.searchParams.get('name'), size: String(pdf.length) });
  });
  const result = await copyDriveFileToProductionStorage('qa_drive_file_12345', undefined, 'qa-resource', 'pdf', 'free', tokenProvider);
  assert.equal(uploaded, true); assert.equal(result.fileSizeBytes, pdf.length); assert.match(result.productionFileUrl, /^https:\/\/storage.googleapis.com\//);
});
test('Drive permission failure rejects the import instead of inventing a storage URL', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 403 }));
  await assert.rejects(copyDriveFileToProductionStorage('qa_drive_file_12345', undefined, 'qa', 'pdf', 'free', tokenProvider), /403/);
});
test('registry parsing preserves approval and explicit false visibility options', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ values: [['content_id', 'title', 'status', 'visibility', 'content_type', 'access_type', 'download_allowed'], ['QA', 'Title', 'Approved', 'Hidden', 'pdf', 'free', 'FALSE']] }));
  const result = await readRegistrySheet({ spreadsheetId: 'qa_sheet_12345', tabName: 'Content Registry' }, tokenProvider);
  assert.equal(result.rows[0].sheetRow, 2); assert.equal(result.rows[0].row.download_allowed, false); assert.equal(result.rows[0].row.status, 'Approved');
});
test('sheet write-back changes metadata cells with RAW values only', async t => {
  t.mock.method(globalThis, 'fetch', async (_url: any, init: any) => {
    const body = JSON.parse(init.body); assert.equal(body.valueInputOption, 'RAW');
    assert.deepEqual(body.data.map((item: any) => item.range), ["'Content Registry'!C4", "'Content Registry'!D4"]);
    return Response.json({ totalUpdatedCells: 2 });
  });
  await writeRegistryResult({ spreadsheetId: 'qa_sheet_12345', tabName: 'Content Registry' }, 4, ['content_id', 'title', 'status', 'firestore_id'], { success: true, firestore_id: 'cms-qa' }, 'test-only-oauth-token');
});
test('approved embedded registry rows update one actual CMS resource and respect hidden status', async () => {
  const originalContent = contentCmsManager.exportState(); const originalJobs = ingestionState.exportState();
  const row = { content_id: 'QA-REGISTRY-IDEMPOTENT', title: 'QA registry embedded video', slug: 'qa-registry-embedded-video', class: 'Class 10', category: 'Algebra', content_type: 'youtube', access_type: 'free', embed_url: 'https://www.youtube.com/watch?v=qa-example', status: 'Approved', visibility: 'Visible' } as ContentRegistryRow;
  try {
    const first = await processRegistryRow(row, 'admin_manual_sync'); assert.equal(first.success, true);
    const second = await processRegistryRow({ ...row, title: 'QA edited registry video', visibility: 'Hidden' }, 'admin_manual_sync');
    assert.equal(second.success, true); assert.equal(second.firestore_id, first.firestore_id);
    const stored = contentCmsManager.getItem(first.firestore_id!)!;
    assert.equal(stored.title, 'QA edited registry video'); assert.equal(stored.visible, false);
    assert.equal(contentCmsManager.exportState().filter(item => item.id === first.firestore_id).length, 1);
  } finally { contentCmsManager.importState(originalContent); ingestionState.importState(originalJobs); }
});
test('ingestion never accepts the old default webhook secret without explicit configuration', () => {
  const before = process.env.INGESTION_WEBHOOK_SECRET; delete process.env.INGESTION_WEBHOOK_SECRET;
  try { assert.equal(verifyWebhookSecret('Bearer mayf_ingest_secret_change_in_production_2026'), false); }
  finally { if (before !== undefined) process.env.INGESTION_WEBHOOK_SECRET = before; }
});
