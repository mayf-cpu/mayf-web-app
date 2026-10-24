import assert from 'node:assert/strict';
import { test } from 'node:test';
import { configurePdfBucket, readVerifiedPdf } from '../src/lib/download/pdfObjectStorage';

const valid = new TextEncoder().encode('%PDF-1.7\nhello\n%%EOF\n');
const id = 'dl-bounded-test';
function mock(bytes: Uint8Array, declaredSize: number, onCancel?: () => void) {
  configurePdfBucket({
    head: async () => ({size: declaredSize}),
    get: async () => ({size: declaredSize, body: new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes);
        if (!onCancel) controller.close();
      },
      cancel() { onCancel?.(); },
    })}),
  });
}
test('readVerifiedPdf accepts correctly sized valid streamed PDF', async()=>{
  mock(valid, valid.length);
  try { assert.deepEqual(await readVerifiedPdf(id),valid); }
  finally { configurePdfBucket(null); }
});
test('readVerifiedPdf rejects stream larger than declared R2 size', async()=>{
  let cancelled = false;
  mock(valid, valid.length - 1, () => { cancelled = true; });
  try {
    assert.equal(await readVerifiedPdf(id),null);
    assert.equal(cancelled,true);
  } finally { configurePdfBucket(null); }
});
test('readVerifiedPdf rejects incomplete stream declared larger', async()=>{
  mock(valid, valid.length + 1);
  try { assert.equal(await readVerifiedPdf(id),null); }
  finally { configurePdfBucket(null); }
});
