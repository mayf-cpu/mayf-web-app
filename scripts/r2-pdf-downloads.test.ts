import assert from 'node:assert/strict';
import { test } from 'node:test';
import { configurePdfBucket, keyForPdf, pdfExists, readVerifiedPdf } from '../src/lib/download/pdfObjectStorage';

function bucket(bytes: Uint8Array, name = 'pdf/dl-10-cheatsheet.pdf') {
  return {
    head: async (key: string) => key === name ? { size: bytes.byteLength } : null,
    get: async (key: string) => key === name ? {
      size: bytes.byteLength,
      body: new Response(Buffer.from(bytes)).body,
      httpMetadata: { contentType: 'application/pdf' },
    } : null,
  };
}
test('private R2 adapter accepts only registry-safe PDF keys and real PDF bytes', async () => {
  const bytes = new TextEncoder().encode('%PDF-1.7\nValid fixture bytes');
  configurePdfBucket(bucket(bytes));
  assert.equal(keyForPdf('dl-10-cheatsheet'), 'pdf/dl-10-cheatsheet.pdf');
  assert.equal(await pdfExists('dl-10-cheatsheet'), true);
  assert.deepEqual(await readVerifiedPdf('dl-10-cheatsheet'), bytes);
  assert.equal(await pdfExists('missing'), false);
  assert.equal(await readVerifiedPdf('missing'), null);
  assert.throws(() => keyForPdf('../secret'), /Invalid content ID/);
  configurePdfBucket(null);
});
test('private R2 adapter never serves fake files or missing bucket', async () => {
  configurePdfBucket(null);
  assert.equal(await pdfExists('dl-10-cheatsheet'), false);
  assert.equal(await readVerifiedPdf('dl-10-cheatsheet'), null);
  const bytes = new TextEncoder().encode('This is not a PDF but just text');
  configurePdfBucket(bucket(bytes));
  assert.equal(await pdfExists('dl-10-cheatsheet'), true);
  assert.equal(await readVerifiedPdf('dl-10-cheatsheet'), null);
  configurePdfBucket(null);
});
