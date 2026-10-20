import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DurablePaymentRepository } from '../src/lib/payments/durablePaymentRepository';
import type { StoredOrder, Entitlement } from '../src/lib/payments/types';
import type { FirestoreDocumentStore } from '../src/lib/firebase/documentStore';

const order: StoredOrder = {
  orderId: 'ord-1', userId: 'student-1', items: [], grossAmount: 100,
  discount: 0, currency: 'INR', provider: 'razorpay',
  providerOrderId: 'gateway-1', status: 'created',
  createdAt: '2026-10-21T00:00:00Z', paidAt: null,
};
const entitlement: Entitlement = {
  id: 'ent-1', userId: 'student-1', type: 'annual_pass', status: 'active',
  startsAt: '2026-10-21T00:00:00Z', expiresAt: '2027-10-21T00:00:00Z',
  grantedBy: 'payment', orderId: 'ord-1', paymentId: 'pay-1',
  createdAt: '2026-10-21T00:00:00Z', updatedAt: '2026-10-21T00:00:00Z',
};
function fixture() {
  const docs = new Map<string, { data: any; revision: number }>();
  let revision = 0;
  const store = {
    collection: (collection: string) => ({ doc: (id: string) => ({
      get: async () => {
        const record = docs.get(collection + '/' + id);
        return { exists: Boolean(record), data: () => structuredClone(record?.data),
          updateTime: record ? String(record.revision) : undefined };
      },
    }) }),
    commit: async (writes: { collection: string; id: string; data?: Record<string, any>; updateTime?: string }[]) => {
      for (const write of writes) {
        const current = docs.get(write.collection + '/' + write.id);
        if (write.updateTime ? String(current?.revision) !== write.updateTime : Boolean(current))
          throw new Error('Concurrent payment update');
      }
      for (const write of writes) {
        const key = write.collection + '/' + write.id;
        if (write.data === undefined) docs.delete(key);
        else docs.set(key, { data: structuredClone(write.data), revision: ++revision });
      }
    },
  };
  return { repo: new DurablePaymentRepository(store as unknown as FirestoreDocumentStore), docs };
}
const payment = {
  orderId: order.orderId, provider: order.provider, providerOrderId: order.providerOrderId,
  providerPaymentId: 'pay-1', eventId: 'evt-1', entitlement,
  paidAt: '2026-10-21T12:00:00Z',
};

test('durable repository atomically creates order and settles payment', async () => {
  const { repo, docs } = fixture();
  await repo.createOrder(order);
  assert.equal((await repo.getOrder(order.orderId))?.status, 'created');
  assert.equal(await repo.settleVerifiedPayment(payment), 'settled');
  assert.equal((await repo.getOrder(order.orderId))?.status, 'paid');
  assert.equal(docs.get('paymentEntitlements/ent-1')?.data.userId, 'student-1');
  assert.equal(docs.size, 5);
  assert.deepEqual((await repo.getOrderByProviderOrderId('razorpay', 'gateway-1'))?.orderId, 'ord-1');
  assert.equal(await repo.settleVerifiedPayment(payment), 'duplicate');
  assert.equal(docs.size, 5);
});

test('unknown orders and mismatched owner/provider/payment cannot grant access', async () => {
  const { repo, docs } = fixture();
  await assert.rejects(repo.settleVerifiedPayment(payment), /not found/);
  await repo.createOrder(order);
  for (const override of [
    { providerOrderId: 'unrelated-gateway' },
    { entitlement: { ...entitlement, userId: 'attacker' } },
    { entitlement: { ...entitlement, paymentId: 'other-payment' } },
  ]) await assert.rejects(repo.settleVerifiedPayment({ ...payment, ...override }), /does not match/);
  assert.equal(docs.size, 2);
  assert.equal((await repo.getOrder('ord-1'))?.status, 'created');
});

test('duplicate order ID cannot overwrite a previously persisted order', async () => {
  const { repo } = fixture();
  await repo.createOrder(order);
  await assert.rejects(repo.createOrder({ ...order, userId: 'attacker' }), /Concurrent payment update/);
  assert.equal((await repo.getOrder(order.orderId))?.userId, 'student-1');
});

test('the same gateway payment cannot settle a second order under a different event ID', async () => {
  const { repo, docs } = fixture();
  await repo.createOrder(order);
  await repo.createOrder({ ...order, orderId: 'ord-2', userId: 'student-2', providerOrderId: 'gateway-2' });
  assert.equal(await repo.settleVerifiedPayment(payment), 'settled');
  const secondEntitlement = { ...entitlement, id: 'ent-2', userId: 'student-2', orderId: 'ord-2' };
  await assert.rejects(repo.settleVerifiedPayment({
    ...payment, orderId: 'ord-2', providerOrderId: 'gateway-2', eventId: 'evt-2', entitlement: secondEntitlement,
  }), /payment claim conflicts with this order/);
  assert.equal((await repo.getOrder('ord-2'))?.status, 'created');
  assert.equal(docs.has('paymentEntitlements/ent-2'), false);
});

test('already-paid order cannot be settled with a different gateway transaction', async () => {
  const { repo, docs } = fixture();
  await repo.createOrder(order);
  await repo.settleVerifiedPayment(payment);
  // A later independently signed transaction must not overwrite a settled order.
  await assert.rejects(repo.settleVerifiedPayment({
    ...payment, providerPaymentId: 'pay-other', eventId: 'evt-other',
    entitlement: { ...entitlement, paymentId: 'pay-other', id: 'ent-other' },
  }), /different transaction/);
  assert.equal((await repo.getOrder(order.orderId))?.providerPaymentId, 'pay-1');
  assert.equal(docs.has('paymentEntitlements/ent-other'), false);
});

test('missing Firestore revision fails closed before making payment writes', async () => {
  const { repo, docs } = fixture();
  await repo.createOrder(order);
  const existing = docs.get('paymentOrders/ord-1')!;
  // Simulate a malformed repository read with no updateTime.
  const store = {
    collection: (collection: string) => ({ doc: (id: string) => ({
      get: async () => {
        if (collection === 'paymentOrders') return {
          exists: true, data: () => structuredClone(existing.data), updateTime: undefined,
        };
        return { exists: false, data: () => undefined, updateTime: undefined };
      },
    }) }),
    commit: async () => { throw new Error('Must not commit'); },
  };
  const brokenRepo = new DurablePaymentRepository(store as unknown as FirestoreDocumentStore);
  await assert.rejects(brokenRepo.settleVerifiedPayment(payment), /revision unavailable/);
});

test('missing gateway identifiers fail closed and cannot write payment records', async () => {
  const { repo, docs } = fixture();
  await repo.createOrder(order);
  for (const override of [
    { providerOrderId: '' }, { providerPaymentId: '' }, { eventId: '' }, { orderId: '' },
  ]) {
    await assert.rejects(repo.settleVerifiedPayment({ ...payment, ...override }), /identifiers are required/);
  }
  assert.equal(docs.size, 2);
  assert.equal((await repo.getOrder(order.orderId))?.status, 'created');
});

test('gateway order index resolves across new repository instances and rejects wrong provider', async () => {
  const { repo, docs } = fixture();
  await repo.createOrder(order);
  assert.equal((await repo.getOrderByProviderOrderId('razorpay', 'gateway-1'))?.userId, 'student-1');
  assert.equal(await repo.getOrderByProviderOrderId('stripe', 'gateway-1'), null);
  assert.equal(await repo.getOrderByProviderOrderId('razorpay', 'missing'), null);
  docs.get('paymentProviderOrders/razorpay:gateway-1')!.data.orderId = 'missing-order';
  await assert.rejects(repo.getOrderByProviderOrderId('razorpay', 'gateway-1'), /does not match/);
});
