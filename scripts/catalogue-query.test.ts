import test from 'node:test';
import assert from 'node:assert/strict';
import { filterCatalogue } from '../src/lib/catalogue/catalogueQuery';
const item = { id: 'a', title: 'Algebra', visible: true, classLevels: ['Class 10'], categoryId: 'cat', contentType: 'pdf', accessType: 'free', createdAt: '2026-01-01', publishedAt: '2026-01-01', slug: 'algebra' };
test('public catalogue excludes drafts, hidden and archived items and filters current edits', () => {
  const records = [item, { ...item, id: 'b', visible: false }, { ...item, id: 'c', status: 'draft' }, { ...item, id: 'd', isDeleted: true }];
  const result = filterCatalogue(records as any, { search: 'algebra', classLevel: 'Class 10' }, null, 20);
  assert.deepEqual(result.items.map(i => i.id), ['a']);
  assert.equal(filterCatalogue(records as any, { search: 'geometry' }, null, 20).items.length, 0);
});
test('pagination never repeats a page and supports all visible records', () => {
  const records = ['a', 'b', 'c'].map(id => ({ ...item, id, title: id }));
  const first = filterCatalogue(records as any, { sortBy: 'alpha' }, null, 2);
  const last = filterCatalogue(records as any, { sortBy: 'alpha' }, first.nextCursor, 2);
  assert.deepEqual(first.items.map(i => i.id), ['a', 'b']);
  assert.deepEqual(last.items.map(i => i.id), ['c']);
  assert.equal(last.hasMore, false);
});
