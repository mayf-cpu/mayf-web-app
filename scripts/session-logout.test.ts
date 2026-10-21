import test from 'node:test';
import assert from 'node:assert/strict';
import { completeLogout } from '../src/lib/auth/sessionLogout';
test('logout clears identity only after Firebase confirms the session ended', async () => {
  const events: string[] = []; let resolve: () => void;
  const signOut = new Promise<void>(done => { resolve = done; });
  const result = completeLogout(() => signOut, () => { events.push('cleared'); });
  assert.deepEqual(events, []); resolve!(); await result; assert.deepEqual(events, ['cleared']);
});
test('failed sign-out preserves local identity and propagates the failure to the UI', async () => {
  let cleared = false;
  await assert.rejects(completeLogout(async () => { throw new Error('signout unavailable'); }, () => { cleared = true; }), /unavailable/);
  assert.equal(cleared, false);
});
