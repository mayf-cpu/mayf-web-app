import test from 'node:test';
import assert from 'node:assert/strict';
import { readBookmarks, writeBookmarks, bookmarkKey } from '../src/lib/bookmarks/bookmarkStorage';
function storage() { const values = new Map<string, string>(); return { getItem: (key: string) => values.get(key) || null, setItem: (key: string, value: string) => { values.set(key, value); } }; }
test('guest and different accounts retain separate favorites without seeded or legacy shared data', () => {
  const db = storage(); db.setItem('mayf_saved_items', '["legacy-private"]');
  assert.deepEqual(readBookmarks(db), []);
  writeBookmarks(db, ['guest-formula']); writeBookmarks(db, ['one-private'], 'one'); writeBookmarks(db, ['two-private'], 'two');
  assert.deepEqual(readBookmarks(db), ['guest-formula']); assert.deepEqual(readBookmarks(db, 'one'), ['one-private']); assert.deepEqual(readBookmarks(db, 'two'), ['two-private']);
  assert.notEqual(bookmarkKey(), bookmarkKey('guest')); assert.notEqual(bookmarkKey('one/two'), bookmarkKey('one%2Ftwo'));
});
test('malformed local favorites cannot produce bogus object IDs or crash loading', () => {
  const db = storage(); db.setItem(bookmarkKey('one'), 'invalid'); assert.deepEqual(readBookmarks(db, 'one'), []);
  db.setItem(bookmarkKey('one'), '["a","a",null,3,{"id":"b"},""]'); assert.deepEqual(readBookmarks(db, 'one'), ['a']);
});
