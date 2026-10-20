import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FirestoreDocumentStore } from '../src/lib/firebase/documentStore';

test('Firestore query filters entitlements by authenticated user ID on the server', async t => {
  let requestBody: any;
  t.mock.method(globalThis, 'fetch', async (_url, options: any) => {
    requestBody = JSON.parse(options.body);
    return new Response(JSON.stringify([
      { document: { name: 'projects/p/databases/(default)/documents/paymentEntitlements/e1',
        fields: { userId: { stringValue: 'student-a' }, status: { stringValue: 'active' } },
        updateTime: '2026-10-21T00:00:00Z' } },
      { readTime: '2026-10-21T00:00:00Z' },
    ]), { status: 200 });
  });
  const store = new FirestoreDocumentStore('p', async () => 'test-token');
  const results = await store.queryEqual('paymentEntitlements', 'userId', 'student-a');
  assert.equal(requestBody.structuredQuery.where.fieldFilter.field.fieldPath, 'userId');
  assert.equal(requestBody.structuredQuery.where.fieldFilter.value.stringValue, 'student-a');
  assert.equal(requestBody.structuredQuery.from[0].collectionId, 'paymentEntitlements');
  assert.equal(results.length, 1);
  assert.equal(results[0].id, 'e1');
  assert.equal(results[0].data.userId, 'student-a');
});

test('invalid user IDs fail before contacting Firestore', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('Must not query'); });
  const store = new FirestoreDocumentStore('p', async () => 'token');
  await assert.rejects(store.queryEqual('paymentEntitlements', 'userId', ''), /Invalid Firestore query/);
  await assert.rejects(store.queryEqual('paymentEntitlements', 'user/id', 'student-a'), /Invalid Firestore query/);
});
