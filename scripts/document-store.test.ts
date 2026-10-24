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
test('Firestore lists all pages and conditional commits reject concurrent changes', async t => {
  const calls: { url: string; init?: RequestInit }[] = [];
  let count = 0;
  t.mock.method(globalThis, 'fetch', async (url: any, init: any) => {
    calls.push({ url: String(url), init });
    if (init.method === 'POST') return new Response('', { status: 409 });
    count++;
    return Response.json(count === 1 ? { documents: [{ name: 'projects/p/databases/(default)/documents/contentItems/a', fields: { title: { stringValue: 'A' } }, updateTime: 'revision-1' }], nextPageToken: 'next page' } : { documents: [] });
  });
  const store = new FirestoreDocumentStore('p', async () => 'test-token');
  const documents = await store.list('contentItems');
  assert.equal(documents.length, 1);
  assert.match(calls[1].url, /pageToken=next\+page/);
  await assert.rejects(store.commit([{ collection: 'contentItems', id: 'a', data: { title: 'B' }, updateTime: documents[0].updateTime }]), /Another administrator/);
  const payload = JSON.parse(calls[2].init!.body as string);
  assert.deepEqual(payload.writes[0].currentDocument, { updateTime: 'revision-1' });
});
