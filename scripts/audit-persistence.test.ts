import test from 'node:test';
import assert from 'node:assert/strict';
import { AuditLogService } from '../src/lib/audit/auditLogger';
import { DocumentStateRepository } from '../src/lib/firebase/documentStateRepository';
const entry = { action: 'CONTENT_UPDATED' as const, category: 'content' as const, actorUid: 'admin', actorEmail: '=FORMULA@example.test', actorRole: 'admin' as const, targetId: 'resource', targetType: 'chapter', details: { title: 'Maths, "chapter"' }, status: 'success' as const };
function fixture() {
  const records = new Map<string, any>(); let fail = false;
  const store = {
    list: async (collection: string) => [...records.entries()].filter(([key]) => key.startsWith(collection + '/')).map(([key, data]) => ({ id: key.split('/')[1], data: structuredClone(data), updateTime: 'v1' })),
    collection: (collection: string) => ({ doc: (id: string) => ({
      get: async () => ({ exists: records.has(collection + '/' + id), updateTime: records.has(collection + '/' + id) ? 'v1' : undefined, data: () => structuredClone(records.get(collection + '/' + id)) }),
      set: async (data: any) => { if (fail) throw new Error('storage unavailable'); records.set(collection + '/' + id, structuredClone(data)); },
    }) }),
    commit: async (changes: any[]) => { if (fail) throw new Error('storage unavailable'); for (const change of changes) if (change.data) records.set(change.collection + '/' + change.id, structuredClone(change.data)); },
  };
  return { store, fresh: () => new AuditLogService(() => store as any), fail: () => { fail = true; } };
}
test('audit has no sample records, survives fresh services and safely exports CSV', async () => {
  const f = fixture(); assert.deepEqual(await f.fresh().getLogs(), []);
  await f.fresh().log(entry);
  assert.equal((await f.fresh().getLogs({ targetId: 'resource' })).length, 1);
  const csv = await f.fresh().exportCsv(); assert.match(csv, /'=FORMULA@example.test/); assert.match(csv, /Maths,/);
  assert.deepEqual(await f.fresh().getLogs({ category: 'security' }), []);
});
test('catalogue mutation and its audit record commit together, failed writes leave neither', async () => {
  const f = fixture(); let memory: any[] = [];
  const state = { exportState: () => structuredClone(memory), importState: (items: any[]) => { memory = items; } };
  const repo = new DocumentStateRepository([{ collection: 'contentItems', state }], () => f.store as any);
  await repo.run(async () => { memory.push({ id: 'resource', title: 'Saved' }); await f.fresh().log(entry); }, true);
  assert.equal((await f.fresh().getLogs()).length, 1);
  f.fail();
  await assert.rejects(repo.run(async () => { memory.push({ id: 'lost', title: 'Unsaved' }); await f.fresh().log({ ...entry, targetId: 'lost' }); }, true), /storage unavailable/);
  assert.equal(memory.length, 1); assert.deepEqual(await f.fresh().getLogs({ targetId: 'lost' }), []);
});
test('unsuccessful repository responses discard staged audit successes', async () => {
  const f = fixture(); const state = { exportState: () => [], importState: () => {} };
  const repo = new DocumentStateRepository([{ collection: 'contentItems', state }], () => f.store as any);
  await repo.run(async () => { await f.fresh().log(entry); return { failed: true }; }, true);
  assert.deepEqual(await f.fresh().getLogs(), []);
  f.fail(); await assert.rejects(f.fresh().log(entry), /storage unavailable/);
});
