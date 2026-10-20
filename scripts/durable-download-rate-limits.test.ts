import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DurableDownloadLimiter } from '../src/lib/download/durableDownloadLimiter';
import type { FirestoreDocumentStore } from '../src/lib/firebase/documentStore';

function mockStore() {
  const docs = new Map<string, { rev: number; data: Record<string, unknown> }>();
  const store = {
    collection: (name: string) => ({ doc: (id: string) => ({
      get: async () => {
        const found = docs.get(name + '/' + id);
        return { exists: !!found, updateTime: found ? String(found.rev) : undefined,
          data: () => found?.data };
      },
    }) }),
    commit: async (writes: Array<{ collection: string; id: string; data: Record<string, unknown>; updateTime?: string }>) => {
      for (const write of writes) {
        const k = write.collection + '/' + write.id;
        const old = docs.get(k);
        if (write.updateTime ? !old || String(old.rev) !== write.updateTime : !!old)
          throw new Error('Conflict');
        docs.set(k, { rev: (old?.rev || 0) + 1, data: write.data });
      }
    },
  };
  return { store: store as unknown as FirestoreDocumentStore, docs };
}
test('rate limiting counts requests across distinct limiter instances', async () => {
  const {store} = mockStore();
  const first = new DurableDownloadLimiter(store);
  const second = new DurableDownloadLimiter(store);
  assert.equal(await first.isLimited('user:abc', 2, 60000, 100000), false);
  assert.equal(await second.isLimited('user:abc', 2, 60000, 100001), false);
  assert.equal(await first.isLimited('user:abc', 2, 60000, 100002), true);
  assert.equal(await second.isLimited('user:abc', 2, 60000, 170002), false);
});
test('database failures fail closed instead of disabling the limiter', async () => {
  const broken = new DurableDownloadLimiter({
    collection: () => ({ doc: () => ({ get: async () => { throw new Error('Firestore offline'); } }) }),
  } as unknown as FirestoreDocumentStore);
  await assert.rejects(broken.isLimited('user:x', 1, 60000), /Firestore offline/);
});
