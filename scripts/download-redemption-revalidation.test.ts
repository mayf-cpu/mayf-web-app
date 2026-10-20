import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolveDownloadableItem } from '../src/lib/download/cmsDownloadResolver';
import type { FirestoreDocumentStore } from '../src/lib/firebase/documentStore';

const active = {
  id: 'cnt-pdf-001', slug: 'algebra-pdf', title: 'Algebra',
  visible: true, status: 'published', isDeleted: false, downloadAllowed: true,
  contentType: 'pdf', accessType: 'paid',
  files: [{ url: 'r2://mayf-study-materials/pdf/cnt-pdf-001.pdf', sizeBytes: 1000 }],
};
function store(content: Record<string, unknown>) {
  return {
    collection: () => ({ doc: () => ({ get: async () => ({ exists: true, data: () => content }) }) }),
    queryEqual: async () => [],
  } as unknown as FirestoreDocumentStore;
}
test('redeeming previously authorized content after an admin unpublishes it cannot resolve', async () => {
  const before = await resolveDownloadableItem(store(active), active.id);
  assert.equal(before?.accessType, 'paid');
  const hidden = await resolveDownloadableItem(store({ ...active, status: 'hidden', visible: false }), active.id);
  assert.equal(hidden, null);
  const changedTier = await resolveDownloadableItem(store({ ...active, accessType: 'free' }), active.id);
  assert.equal(changedTier?.accessType, 'free');
  assert.notEqual(changedTier?.accessType, before?.accessType);
});
test('file endpoint checks publication and subscription before fetching PDF bytes', () => {
  const src = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  const endpoint = src.slice(src.indexOf("app.get('/api/downloads/file/:token'"));
  const validate = endpoint.indexOf('const currentItem = await resolveDownloadableItem');
  const entitlement = endpoint.indexOf('await getAuthoritativePassStatus(tokenRecord.uid)');
  const fetchPdf = endpoint.indexOf('const pdf = await readVerifiedPdf');
  const consume = endpoint.indexOf('await tokens.consume(token, tokenRecord)');
  assert.ok(validate >= 0 && entitlement > validate && fetchPdf > entitlement && consume > fetchPdf);
});
