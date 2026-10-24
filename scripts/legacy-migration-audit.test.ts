import assert from 'node:assert/strict';
import { test } from 'node:test';
import { auditLegacyPdfMigration } from '../src/lib/download/legacyMigrationAudit';
import { DOWNLOADABLE_ITEMS } from '../src/lib/download/downloadRegistry';
import { configurePdfBucket } from '../src/lib/download/pdfObjectStorage';
import type { FirestoreDocumentStore } from '../src/lib/firebase/documentStore';
test('audit never creates CMS records or uploads PDFs',async()=>{
 let reads=0;
 const store = { collection: () => ({ doc: () => ({ get: async () => { reads++; return { exists: false, data: () => undefined }; } }) }) } as unknown as FirestoreDocumentStore;
 const previous=DOWNLOADABLE_ITEMS.length;
 configurePdfBucket(null);
 const report=await auditLegacyPdfMigration(store);
 assert.equal(report.total,previous);
 assert.equal(reads,previous);
 assert.equal(report.ready,0);
 assert.ok(report.rows.every(r=>r.status==='cms_missing'));
});
