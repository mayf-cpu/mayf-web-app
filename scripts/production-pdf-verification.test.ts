import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { verifyPublishedPdf } from './seed-production-pdf.mjs';
test('production PDF copy verification requires accepted size, PDF structure and matching hash',()=>{
  const bytes=Buffer.from('%PDF-1.3\naccepted test object\n%%EOF');
  const digest=createHash('sha256').update(bytes).digest('hex');
  assert.doesNotThrow(()=>verifyPublishedPdf(bytes,digest,bytes.length));
  assert.throws(()=>verifyPublishedPdf(bytes,'0'.repeat(64),bytes.length));
  assert.throws(()=>verifyPublishedPdf(bytes,digest,bytes.length+1));
  const invalid=Buffer.from('HTML ERROR DOCUMENT');
  assert.throws(()=>verifyPublishedPdf(invalid,createHash('sha256').update(invalid).digest('hex'),invalid.length));
});
