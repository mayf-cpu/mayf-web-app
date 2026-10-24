import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchAuthorizedPdf } from '../src/lib/download/downloadClient';
const url = '/api/downloads/file/' + 'a'.repeat(64);
const pdf = '%PDF-1.7\nActual transport fixture\n%%EOF\n';

test('authorized PDF delivery redeems once and returns verified PDF bytes', async () => {
  let calls = 0;
  const blob = await fetchAuthorizedPdf(url, (async (input, options) => {
    calls++; assert.equal(input, url); assert.equal(options?.redirect, 'manual');
    return new Response(pdf, { headers: { 'Content-Type': 'application/pdf' } });
  }) as typeof fetch);
  assert.equal(calls, 1); assert.equal(blob.type, 'application/pdf');
  assert.equal(await blob.text(), pdf);
});

test('failed redemption reports the server failure instead of download success', async () => {
  await assert.rejects(fetchAuthorizedPdf(url, (async () => new Response(JSON.stringify({
    error: 'This download link has already been used or has expired.',
  }), { status: 409, headers: { 'Content-Type': 'application/json' } })) as typeof fetch), /already been used/);
});

test('HTML errors and truncated PDFs cannot become successful downloads or previews', async () => {
  for (const [body, mime] of [['<html>Error</html>', 'text/html'], ['not a PDF', 'application/pdf'], ['%PDF-1.7\ntruncated bytes', 'application/pdf']]) {
    await assert.rejects(fetchAuthorizedPdf(url, (async () => new Response(body, {
      headers: { 'Content-Type': mime },
    })) as typeof fetch), /PDF/);
  }
});

test('delivery never follows arbitrary external, private-storage or malformed addresses', async () => {
  for (const address of ['https://example.test/file.pdf', 'r2://bucket/file.pdf', '/api/admin/users', url + '?redirect=1']) {
    await assert.rejects(fetchAuthorizedPdf(address, (async () => { throw Error('Must not fetch'); }) as typeof fetch), /Invalid secure download address/);
  }
});
