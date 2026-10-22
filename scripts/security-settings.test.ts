import assert from 'node:assert/strict';
import test from 'node:test';
import { createSecuritySettings } from '../src/lib/security/securitySettings';
function fixture() {
  const docs = new Map<string, any>(); let revision = 0; let fail = false;
  const db = {
    collection: (collection: string) => ({ doc: (id: string) => ({ get: async () => {
      const row = docs.get(collection + '/' + id);
      return { exists: !!row, updateTime: row?.revision, data: () => structuredClone(row?.data) };
    } }) }),
    commit: async (changes: any[]) => {
      if (fail) throw new Error('storage unavailable');
      for (const change of changes) if (docs.get(change.collection + '/' + change.id)?.revision !== change.updateTime) throw new Error('conflict');
      for (const change of changes) docs.set(change.collection + '/' + change.id, { data: structuredClone(change.data), revision: String(++revision) });
    },
  };
  return { docs, fresh: () => createSecuritySettings(() => db as any), fail: () => { fail = true; } };
}
const actor = { uid: 'operator', email: 'operator@example.test', role: 'superAdmin' };
test('maintenance persists across restart with its audit event in the same commit', async () => {
  const f = fixture(); await f.fresh().save({ emergencyMaintenanceMode: true }, actor);
  assert.equal((await f.fresh().read()).emergencyMaintenanceMode, true);
  const audit = [...f.docs.entries()].find(([key]) => key.startsWith('adminAuditLogs/'))![1].data;
  assert.equal(audit.actorUid, actor.uid); assert.equal(audit.details.emergencyMaintenanceMode, true);
});
test('unavailable storage cannot report maintenance saved or leak volatile success', async () => {
  const f = fixture(); await f.fresh().save({ emergencyMaintenanceMode: false }, actor); const size = f.docs.size;
  f.fail(); await assert.rejects(f.fresh().save({ emergencyMaintenanceMode: true }, actor), /storage unavailable/);
  assert.equal((await f.fresh().read()).emergencyMaintenanceMode, false); assert.equal(f.docs.size, size);
  await assert.rejects(createSecuritySettings(() => null).read(), /storage unavailable/);
});
test('ordinary admins, malformed mode and unsupported security changes are rejected', async () => {
  const f = fixture();
  await assert.rejects(f.fresh().save({ emergencyMaintenanceMode: true }, { ...actor, role: 'admin' }), /superAdmin/);
  for (const input of [{ emergencyMaintenanceMode: 'true' }, { emergencyMaintenanceMode: true, requireCloudflareAccess: true }, {}]) {
    await assert.rejects(f.fresh().save(input, actor));
  }
  assert.equal(f.docs.size, 0);
});
test('simultaneous maintenance changes reject the stale revision and its audit entry', async () => {
  const f = fixture(); await f.fresh().save({ emergencyMaintenanceMode: false }, actor);
  const results = await Promise.allSettled([true, false].map(value => f.fresh().save({ emergencyMaintenanceMode: value }, actor)));
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal([...f.docs.keys()].filter(key => key.startsWith('adminAuditLogs/')).length, 2);
});
