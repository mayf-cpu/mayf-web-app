import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hasPdfMarkers } from '../src/lib/download/pdfIntegrity';

const bytes = (s:string) => new TextEncoder().encode(s);
test('accepts PDF versions with EOF and trailing whitespace',()=>{
  assert.equal(hasPdfMarkers(bytes('%PDF-1.7\nbody\n%%EOF\n')),true);
  assert.equal(hasPdfMarkers(bytes('%PDF-2.0\nbody\n%%EOF\r\n')),true);
});
test('rejects truncated and forged PDF sources',()=>{
  for (const input of ['%PDF-1.7\npartial', '%PDF-9.9\nbody\n%%EOF',
    '<html>error</html>', '%PDF-1.7\nbody\n%%EOF\nextra']) {
    assert.equal(hasPdfMarkers(bytes(input)),false,input);
  }
});
