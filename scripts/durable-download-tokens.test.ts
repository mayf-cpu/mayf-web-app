import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DurableDownloadTokens } from '../src/lib/download/durableDownloadTokens';
import type { FirestoreDocumentStore } from '../src/lib/firebase/documentStore';

function fakeStore() {
  const docs = new Map<string, { data: Record<string, unknown>; rev: number }>();
  const store = {
    collection: (collection: string) => ({ doc: (id: string) => ({
      get: async () => {
        const v = docs.get(collection + '/' + id);
        return { exists: Boolean(v), updateTime: v ? String(v.rev) : undefined,
          data: () => v?.data };
      },
    }) }),
    commit: async (writes: Array<{ collection: string; id: string; data: Record<string, unknown>; updateTime?: string }>) => {
      for (const w of writes) {
        const d = docs.get(w.collection + '/' + w.id);
        if (w.updateTime ? !d || String(d.rev) !== w.updateTime : Boolean(d))
          throw new Error('Concurrent write rejected');
      }
      for (const w of writes) {
        const k = w.collection + '/' + w.id;
        docs.set(k, { data: w.data, rev: (docs.get(k)?.rev || 0) + 1 });
      }
    },
  };
  return new DurableDownloadTokens(store as unknown as FirestoreDocumentStore);
}
const id = 'a'.repeat(64);
const record = () => ({ contentId: 'dl-10-cheatsheet', fileName: 'test.pdf',
  accessType: 'free' as const, uid: null, clientIpHash: 'hash',
  expiresAt: Date.now() + 60000 });
test('download tokens persist and allow exactly one redemption', async () => {
  const store = fakeStore();
  await store.create(id, record());
  const first = await store.peek(id);
  assert.ok(first);
  await store.consume(id, first);
  assert.equal(await store.peek(id), null);
  await assert.rejects(store.consume(id, first), /used/);
});
test('download tokens reject missing tokens and changed identities', async () => {
  const store = fakeStore();
  assert.equal(await store.peek(id), null);
  await assert.rejects(store.create('bad', record()), /Invalid download token/);
  await store.create(id, record());
  const first = await store.peek(id);
  assert.ok(first);
  await assert.rejects(store.consume(id, { ...first, uid: 'imposter' }), /changed/);
});
