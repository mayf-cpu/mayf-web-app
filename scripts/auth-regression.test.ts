import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getAdminAuth, verifyStudentSessionToken } from '../src/lib/firebase/admin';

test('failed Firebase verification cannot grant privileges from a forged payload', async (t) => {
  const auth = getAdminAuth();
  assert.ok(auth);
  t.mock.method(auth, 'verifyIdToken', async () => { throw new Error('Invalid signature'); });
  const payload = Buffer.from(JSON.stringify({
    iss: 'https://securetoken.google.com/maths-at-your-fingertips',
    exp: Math.floor(Date.now() / 1000) + 3600,
    email_verified: true,
    email: 'attacker@example.com',
    sub: 'forged-user',
    superAdmin: true,
  })).toString('base64url');
  const result = await verifyStudentSessionToken(`e30.${payload}.invalid`);
  assert.equal(result.valid, false);
  assert.equal(result.superAdmin, undefined);
});

test('verified student and administrator claims retain their roles', async (t) => {
  const auth = getAdminAuth();
  assert.ok(auth);
  const verifier = t.mock.method(auth, 'verifyIdToken', async () => ({
    uid: 'verified-student', email: 'student@example.com', pro: true, admin: false,
  }));
  const student = await verifyStudentSessionToken('header.payload.signature');
  assert.equal(student.valid, true);
  assert.equal(student.role, 'student');
  assert.equal(student.pro, true);
  verifier.mock.mockImplementation(async () => ({
    uid: 'verified-admin', email: 'administrator@example.com', pro: true, admin: true,
  }));
  const admin = await verifyStudentSessionToken('header.payload.signature');
  assert.equal(admin.valid, true);
  assert.equal(admin.role, 'admin');
});

test('production rejects development tokens', async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    assert.equal((await verifyStudentSessionToken('dev-superadmin-token')).valid, false);
    assert.equal((await verifyStudentSessionToken()).valid, false);
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});
