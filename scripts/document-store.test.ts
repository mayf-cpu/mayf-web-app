import test from 'node:test';
import assert from 'node:assert/strict';
import { FirestoreDocumentStore, encodeValue, decodeValue } from '../src/lib/firebase/documentStore';

test('settings documents retain nested fields, empty arrays, booleans and numeric values', () => {
  const data = { title: 'MAYF', blocks: [{ visible: false, position: 2, price: 99.5 }], empty: [], nullable: null };
  assert.deepEqual(decodeValue(encodeValue(data)), data);
  assert.throws(() => encodeValue(NaN));
});
test('Firestore uses server OAuth and surfaces rejected reads and writes', async t => {
  const calls: { url: string; init?: RequestInit }[] = [];
  let response = new Response('', { status: 404 });
  t.mock.method(globalThis, 'fetch', async (url: any, init: any) => { calls.push({ url: String(url), init }); return response; });
  const store = new FirestoreDocumentStore('test-project', async () => 'test-access-token');
  const document = store.collection('siteSettings').doc('general');
  assert.equal((await document.get()).exists, false);
  response = new Response('', { status: 403 });
  await assert.rejects(document.get(), /read failed \(403\)/);
  await assert.rejects(document.set({ title: 'MAYF' }), /write failed \(403\)/);
  response = new Response(JSON.stringify({ fields: { visible: { booleanValue: false } } }), { status: 200 });
  assert.deepEqual((await document.get()).data(), { visible: false });
  const headers = calls[0].init?.headers as Record<string, string>;
  assert.equal(headers.Authorization, 'Bearer test-access-token');
  assert.match(calls[0].url, /^https:\/\/firestore.googleapis.com\/v1\/projects\/test-project\//);
});
