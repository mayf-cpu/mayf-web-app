import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DurableDownloadAudit } from '../src/lib/download/durableDownloadAudit';
import type { FirestoreDocumentStore } from '../src/lib/firebase/documentStore';
const event = (id: string, timestamp: string) => ({
  id, contentId: 'dl-10-cheatsheet', timestamp, uid: 'student-1',
  accessType: 'paid' as const, status: 'successful' as const, action: 'authorize' as const,
  securityMeta: { ipHash: 'hashed-ip' },
});
test('download audit is persisted and reloaded from Firestore in newest-first order', async () => {
  const docs = new Map<string, Record<string, unknown>>();
  const store = {
    commit: async (writes: Array<{collection:string;id:string;data:Record<string,unknown>}>) => {
      for (const w of writes) {
        assert.equal(w.collection,'downloadAuditLogs');
        if(docs.has(w.id)) throw new Error('duplicate event');
        docs.set(w.id,w.data);
      }
    },
    list: async (name: string) => {
      assert.equal(name,'downloadAuditLogs');
      return Array.from(docs.entries()).map(([id,data])=>({id,data,updateTime:'x'}));
    },
  } as unknown as FirestoreDocumentStore;
  const writer = new DurableDownloadAudit(store);
  await writer.record(event('log-000001','2026-10-21T00:00:00Z'));
  await writer.record(event('log-000002','2026-10-22T00:00:00Z'));
  const freshReader = new DurableDownloadAudit(store);
  assert.deepEqual((await freshReader.recent()).map(x=>x.id), ['log-000002','log-000001']);
  assert.deepEqual((await freshReader.recent(1)).map(x=>x.id), ['log-000002']);
});
test('database outage does not silently acknowledge download audits', async () => {
  const broken = new DurableDownloadAudit({
    commit: async () => { throw new Error('Firestore offline'); },
    list: async () => { throw new Error('Firestore offline'); },
  } as unknown as FirestoreDocumentStore);
  await assert.rejects(broken.record(event('log-000003','2026-10-21T00:00:00Z')), /offline/);
  await assert.rejects(broken.recent(), /offline/);
  await assert.rejects(broken.recent(501), /Invalid audit limit/);
});
