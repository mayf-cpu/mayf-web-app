import test from 'node:test';
import assert from 'node:assert/strict';
import { SessionGuard } from '../src/lib/auth/sessionGuard';
test('a delayed profile cannot restore an account after sign-out or another sign-in', async () => {
  const guard = new SessionGuard(); const old = guard.begin(); let applied = false; let resolve: () => void;
  const pending = new Promise<void>(done => { resolve = done; }).then(() => { if (old()) applied = true; });
  const current = guard.begin(); resolve!(); await pending;
  assert.equal(applied, false); assert.equal(current(), true);
});
test('unmount invalidates profile work still waiting on Firebase', () => {
  const guard = new SessionGuard(); const current = guard.begin(); guard.invalidate(); assert.equal(current(), false);
});
