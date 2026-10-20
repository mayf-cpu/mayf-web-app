import test from 'node:test';
import assert from 'node:assert/strict';
import { getVerifiedClaims } from '../src/lib/firebase/authClaims';
test('the backup account is an administrator in the UI only after email verification', async () => {
  const user = { email: 'mayfbackup@gmail.com', emailVerified: true, getIdTokenResult: async () => ({ claims: {} }) };
  const claims = await getVerifiedClaims(user as any);
  assert.equal(claims.role, 'admin');
  assert.equal(claims.isSuperAdmin, false);
  user.emailVerified = false;
  assert.equal((await getVerifiedClaims(user as any)).role, 'student');
});
