import test from 'node:test';
import assert from 'node:assert/strict';
import { ActivityCache } from '../src/lib/activity/activityCache';
test('account switching and sign-out clear activity and recently viewed state', () => {
  const cache = new ActivityCache(); assert.deepEqual(cache.activities, []);
  cache.switchTo('one'); cache.activities = [{ userId: 'one', id: 'a' } as any]; cache.recentlyViewed = [{ id: 'private-one' } as any];
  cache.switchTo('two'); assert.deepEqual(cache.activities, []); assert.deepEqual(cache.recentlyViewed, []);
  cache.apply('two', [{ userId: 'two', id: 'b' } as any]); cache.switchTo(null); assert.deepEqual(cache.activities, []);
});
test('a delayed previous-account load cannot replace current activity or include another owner', () => {
  const cache = new ActivityCache(); cache.switchTo('two');
  assert.equal(cache.apply('two', [{ userId: 'two', id: 'b' }, { userId: 'one', id: 'a' }] as any), true);
  assert.equal(cache.apply('one', [{ userId: 'one', id: 'a' }] as any), false);
  assert.deepEqual(cache.activities.map(item => item.id), ['b']);
});
