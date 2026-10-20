import test from 'node:test';
import assert from 'node:assert/strict';
import { CatalogueRepository } from '../src/lib/cms/catalogueRepository';
function fixture() {
  let memory: any[] = [{ id: 'existing', title: 'Original', visible: true }];
  let documents = new Map(memory.map(data => [data.id, { id: data.id, data: structuredClone(data), updateTime: 'v1' }]));
  let reject = false;
  const state = { exportState: () => structuredClone(memory), importState: (items: any[]) => { memory = structuredClone(items); } };
  const store = {
    collection: () => ({ doc: () => ({ get: async () => ({ exists: true }) }) }),
    list: async () => structuredClone([...documents.values()]),
    commit: async (changes: any[]) => {
      if (reject) throw new Error('Firestore commit failed (403)');
      for (const change of changes) {
        assert.equal(change.updateTime, documents.get(change.id)?.updateTime);
        if (change.data) documents.set(change.id, { id: change.id, data: structuredClone(change.data), updateTime: 'v2' });
        else documents.delete(change.id);
      }
    },
  };
  const repository = () => new CatalogueRepository([{ collection: 'contentItems', state }], () => store as any);
  return { state, repository, failWrites: () => { reject = true; } };
}
test('content lifecycle persists across fresh repositories and removed items stay removed', async () => {
  const { state, repository } = fixture();
  const mutate = (fn: (items: any[]) => any[]) => repository().run(() => state.importState(fn(state.exportState())), true);
  await mutate(items => [...items, { id: 'new', title: 'QA draft', visible: false }]);
  assert.equal(await repository().run(() => state.exportState().length), 2);
  await mutate(items => items.map(item => item.id === 'new' ? { ...item, visible: true } : item));
  assert.equal(await repository().run(() => state.exportState().find(item => item.id === 'new').visible), true);
  await mutate(items => items.map(item => ({ ...item, visible: false, isDeleted: true })));
  assert.equal(await repository().run(() => state.exportState().every(item => item.isDeleted)), true);
  await mutate(() => []);
  assert.deepEqual(await repository().run(() => state.exportState()), []);
});
test('rejected writes do not report success or change committed content', async () => {
  const { state, repository, failWrites } = fixture();
  failWrites();
  await assert.rejects(repository().run(() => state.importState([{ id: 'existing', title: 'Unsaved' }]), true), /403/);
  assert.equal(state.exportState()[0].title, 'Original');
});
test('validation errors roll back partial category/content edits', async () => {
  const { state, repository } = fixture();
  await repository().run(() => { state.importState([]); return { failed: true }; }, true);
  assert.equal(state.exportState().length, 1);
});
