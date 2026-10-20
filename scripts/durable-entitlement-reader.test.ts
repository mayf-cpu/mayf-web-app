import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DurableEntitlementReader } from '../src/lib/payments/durableEntitlementReader';
import type { FirestoreDocumentStore } from '../src/lib/firebase/documentStore';

const now = new Date('2026-10-21T00:00:00.000Z');
const pass = {
  id: 'ent-test', userId: 'student-a', type: 'annual_pass', status: 'active',
  startsAt: '2026-10-01T00:00:00.000Z', expiresAt: '2027-10-01T00:00:00.000Z',
  grantedBy: 'payment', orderId: 'ord-a', paymentId: 'pay-a',
  createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z',
};
function reader(items: Record<string, unknown>[], expiry?: string) {
  return new DurableEntitlementReader({
    queryEqual: async (_collection: string, _field: string, userId: string) => items.filter(data => data.userId === userId).map((data, i) => ({ id: 'doc-' + i, data, updateTime: '' })),
    collection: () => ({ doc: () => ({ get: async () => expiry === undefined
      ? { exists: false, data: () => undefined }
      : { exists: true, data: () => ({ userId: 'student-a', expiresAt: expiry }) } }) }),
  } as unknown as Pick<FirestoreDocumentStore, 'queryEqual' | 'collection'>);
}
test('valid persisted annual pass survives independently of in-memory service', async () => {
  const result = await reader([pass]).checkActiveAnnualPass('student-a', now);
  assert.equal(result.active, true);
  assert.equal(result.entitlement?.id, 'ent-test');
  assert.ok(result.daysRemaining > 0);
});
test('other students, revoked, expired and future passes never provide access', async () => {
  const records = [
    { ...pass, userId: 'student-b' },
    { ...pass, status: 'revoked', id: 'revoked' },
    { ...pass, expiresAt: '2026-01-01T00:00:00Z', id: 'expired' },
    { ...pass, startsAt: '2027-01-01T00:00:00Z', id: 'future' },
    { ...pass, expiresAt: 'not-a-date', id: 'invalid' },
  ];
  assert.equal((await reader(records).checkActiveAnnualPass('student-a', now)).active, false);
  assert.equal((await reader([pass]).checkActiveAnnualPass('student-b', now)).active, false);
  assert.equal((await reader([pass]).checkActiveAnnualPass('', now)).active, false);
});
test('database failure does not silently grant a paid pass', async () => {
  const broken = new DurableEntitlementReader({
    queryEqual: async () => { throw new Error('Firestore is offline'); },
    collection: () => ({ doc: () => ({ get: async () => { throw new Error('Firestore is offline'); } }) }),
  } as unknown as Pick<FirestoreDocumentStore, 'queryEqual' | 'collection'>);
  await assert.rejects(broken.checkActiveAnnualPass('student-a', now), /Firestore is offline/);
});

test('refunded renewal cursor caps outdated active entitlement expiry', async () => {
  const result = await reader([pass], '2026-11-01T00:00:00.000Z').checkActiveAnnualPass('student-a', now);
  assert.equal(result.active, true);
  assert.equal(result.entitlement?.expiresAt, '2026-11-01T00:00:00.000Z');
  assert.equal(result.daysRemaining, 11);
  const refunded = await reader([pass], '2026-10-20T00:00:00.000Z').checkActiveAnnualPass('student-a', now);
  assert.equal(refunded.active, false);
});
