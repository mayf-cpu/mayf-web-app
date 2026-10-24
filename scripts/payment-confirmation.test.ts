import assert from 'node:assert/strict';
import test from 'node:test';
import type { FirestoreDocumentStore } from '../src/lib/firebase/documentStore';
import { readOwnedPaymentConfirmation, waitForPaymentConfirmation } from '../src/lib/payments/paymentConfirmation';
function fixture(status = 'paid', passChanges = {}) {
  const order = { orderId: 'ord-1', userId: 'owner', status, providerPaymentId: 'pay-1' };
  const pass = { orderId: 'ord-1', userId: 'owner', status: 'active', paymentId: 'pay-1', ...passChanges };
  const db = { collection: (collection: string) => ({ doc: () => ({ get: async () => ({ data: () => collection === 'paymentOrders' ? order : pass }) }) }) } as unknown as FirestoreDocumentStore;
  return db;
}
test('confirmation requires ownership and the matching active entitlement, with no writes', async () => {
  assert.equal(await readOwnedPaymentConfirmation(fixture(), 'other-user', 'ord-1'), null);
  assert.equal(await readOwnedPaymentConfirmation(fixture(), 'owner', 'other-order'), null);
  assert.equal((await readOwnedPaymentConfirmation(fixture(), 'owner', 'ord-1'))?.settled, true);
  for (const change of [{ paymentId: 'unrelated' }, { userId: 'other-user' }, { orderId: 'other-order' }, { status: 'revoked' }]) {
    assert.equal((await readOwnedPaymentConfirmation(fixture('paid', change), 'owner', 'ord-1'))?.settled, false);
  }
  assert.equal((await readOwnedPaymentConfirmation(fixture('pending'), 'owner', 'ord-1'))?.settled, false);
});
test('delayed signed settlement confirms only after the ledger and pass agree', async () => {
  let reads = 0;
  const result = await waitForPaymentConfirmation('ord-1', async () => ({ orderId: 'ord-1', status: ++reads < 3 ? 'pending' : 'paid', settled: reads >= 3 }), new AbortController().signal, async () => {});
  assert.equal(result.settled, true); assert.equal(reads, 3);
});
test('pending timeout never claims success or creates a second charge', async () => {
  let reads = 0;
  await assert.rejects(waitForPaymentConfirmation('ord-1', async () => {
    reads++; return { orderId: 'ord-1', status: 'pending', settled: false };
  }, new AbortController().signal, async () => {}), /Do not pay again/);
  assert.equal(reads, 20);
});
test('wrong order, terminal failure and missing atomic pass cannot claim confirmation', async () => {
  for (const result of [{ orderId: 'other', status: 'paid', settled: true },
    { orderId: 'ord-1', status: 'refunded', settled: true }, { orderId: 'ord-1', status: 'paid', settled: false }]) {
    await assert.rejects(waitForPaymentConfirmation('ord-1', async () => result, new AbortController().signal, async () => {}));
  }
});
test('account change cancels a confirmation still waiting for its HTTP reply', async () => {
  const controller = new AbortController(); let reads = 0;
  await assert.rejects(waitForPaymentConfirmation('ord-1', async () => {
    reads++; controller.abort(); return { orderId: 'ord-1', status: 'paid', settled: true };
  }, controller.signal, async () => {}), /cancelled/);
  assert.equal(reads, 1);
});
