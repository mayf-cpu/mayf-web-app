import test from 'node:test';
import assert from 'node:assert/strict';
import { categoryManager } from '../src/lib/categories/categoryManager';
import { contentCmsManager } from '../src/lib/cms/contentManager';
const actor = { uid: 'qa-admin', email: 'qa@example.test', role: 'admin' as const };

test('category counts and renames keep same-named class curricula separate', () => {
  const categories = categoryManager.exportState();
  const content = contentCmsManager.exportState();
  try {
    contentCmsManager.importState([
      { id: 'c8', classLevels: ['Class 8'], categoryId: 'Algebra', topic: 'Algebra' },
      { id: 'c10', classLevels: ['Class 10'], categoryId: 'Algebra', topic: 'Algebra' },
      { id: 'stable', classLevels: ['Class 8'], categoryId: 'cat-c8-algebra', topic: 'Algebra' },
    ]);
    assert.equal(categoryManager.getById('cat-c8-algebra')?.contentCount, 2);
    assert.equal(categoryManager.getById('cat-c10-algebra')?.contentCount, 1);
    categoryManager.rename('cat-c8-algebra', 'Grade eight algebra', actor);
    const items = contentCmsManager.exportState();
    assert.equal(items.find(item => item.id === 'c8')?.topic, 'Grade eight algebra');
    assert.equal(items.find(item => item.id === 'stable')?.categoryId, 'cat-c8-algebra');
    assert.equal(items.find(item => item.id === 'c10')?.topic, 'Algebra');
    assert.equal(categoryManager.getById('cat-c8-algebra')?.contentCount, 2);
  } finally { categoryManager.importState(categories); contentCmsManager.importState(content); }
});

test('deleting a category reassigns ID and legacy references without touching another class', () => {
  const categories = categoryManager.exportState();
  const content = contentCmsManager.exportState();
  try {
    contentCmsManager.importState([
      { id: 'stable', classLevels: ['Class 8'], categoryId: 'cat-c8-algebra', topic: 'Algebra' },
      { id: 'legacy', classLevels: ['Class 8'], categoryId: 'Algebra' },
      { id: 'other-class', classLevels: ['Class 10'], categoryId: 'Algebra' },
    ]);
    assert.throws(() => categoryManager.delete('cat-c8-algebra', {}, actor), /Cannot delete/);
    categoryManager.delete('cat-c8-algebra', { reassignToId: 'cat-c8-geometry' }, actor);
    const items = contentCmsManager.exportState();
    assert.equal(items.find(item => item.id === 'stable')?.categoryId, 'cat-c8-geometry');
    assert.equal(items.find(item => item.id === 'stable')?.topic, 'Geometry');
    assert.equal(items.find(item => item.id === 'legacy')?.categoryId, 'Geometry');
    assert.equal(items.find(item => item.id === 'other-class')?.categoryId, 'Algebra');
    assert.equal(categoryManager.getById('cat-c8-algebra'), null);
  } finally { categoryManager.importState(categories); contentCmsManager.importState(content); }
});
