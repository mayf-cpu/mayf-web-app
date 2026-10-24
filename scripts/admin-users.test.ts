import test from 'node:test';
import assert from 'node:assert/strict';
import { getAdminAuth, adminSetCustomUserClaims, adminUpdateUserDisabledStatus, adminDeleteAuthUser } from '../src/lib/firebase/admin';
import { adminUserManager } from '../src/lib/admin/adminUserManager';
import { asyncRoute } from '../src/lib/http/asyncRoute';
const student = { uid: 'qa-user', email: 'qa@example.test', displayName: 'QA Student', emailVerified: true, metadata: {}, customClaims: { unrelatedFeature: 'retain', role: 'student' } };
test('user listing pages through actual Firebase Auth records and discards example accounts', async t => {
  const auth = getAdminAuth()!;
  const list = t.mock.method(auth, 'listUsers', async (_size: any, token: any) => token
    ? { users: [{ ...student, uid: 'qa-user-2' }] }
    : { users: [student], pageToken: 'next' });
  await adminUserManager.refreshUsers();
  assert.deepEqual(adminUserManager.searchStudents({ includeDisabled: true }).map(user => user.uid), ['qa-user', 'qa-user-2']);
  assert.equal(list.mock.callCount(), 2);
});
test('custom-claim updates preserve unrelated claims and remove cleared expiry', async t => {
  const auth = getAdminAuth()!;
  t.mock.method(auth, 'getUser', async () => ({ ...student, customClaims: { ...student.customClaims, annualPassExpiry: '2026-01-01' } }));
  const write = t.mock.method(auth, 'setCustomUserClaims', async () => {});
  t.mock.method(auth, 'revokeRefreshTokens', async () => {});
  await adminSetCustomUserClaims(student.uid, { annualPass: false, annualPassExpiry: undefined });
  assert.deepEqual(write.mock.calls[0].arguments[1], { unrelatedFeature: 'retain', role: 'student', annualPass: false });
});
test('Firebase disable and delete failures cannot report success', async t => {
  const auth = getAdminAuth()!;
  t.mock.method(auth, 'updateUser', async () => { throw new Error('Firebase permission denied'); });
  t.mock.method(auth, 'deleteUser', async () => { throw new Error('Firebase permission denied'); });
  await assert.rejects(adminUpdateUserDisabledStatus('qa-user', true), /permission denied/);
  await assert.rejects(adminDeleteAuthUser('qa-user'), /permission denied/);
});
test('an ordinary administrator cannot disable another administrator', async t => {
  const auth = getAdminAuth()!;
  t.mock.method(auth, 'getUser', async () => ({ ...student, customClaims: { role: 'superAdmin' } }));
  const write = t.mock.method(auth, 'updateUser', async () => student);
  const result = await adminUserManager.setUserDisabledStatus(student.uid, true, { uid: 'qa-operator', email: 'qa-operator@example.test', role: 'admin' });
  assert.equal(result.success, false);
  assert.equal(write.mock.callCount(), 0);
});
test('rejected asynchronous route handlers reach the Express error middleware', async () => {
  await new Promise<void>((resolve, reject) => {
    const handler = asyncRoute(async () => { throw new Error('Backend rejected write'); });
    handler({} as any, {} as any, (error?: any) => {
      try { assert.match(error.message, /Backend rejected write/); resolve(); } catch (failure) { reject(failure); }
    });
  });
});
