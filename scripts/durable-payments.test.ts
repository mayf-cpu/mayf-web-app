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
  assert.equal(docs.size, 6);
  assert.deepEqual((await repo.getOrderByProviderOrderId('razorpay', 'gateway-1'))?.orderId, 'ord-1');
  assert.equal(await repo.settleVerifiedPayment(payment), 'duplicate');
  assert.equal(docs.size, 6);
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

test('webhook event ID cannot be reused for a different payment or order', async () => {
  const { repo, docs } = fixture();
  await repo.createOrder(order);
  await repo.createOrder({ ...order, orderId: 'ord-2', userId: 'student-2', providerOrderId: 'gateway-2' });
  assert.equal(await repo.settleVerifiedPayment(payment), 'settled');
  const other = { ...payment, orderId: 'ord-2', providerOrderId: 'gateway-2',
    providerPaymentId: 'pay-other', entitlement: { ...entitlement, id: 'ent-other',
      userId: 'student-2', orderId: 'ord-2', paymentId: 'pay-other' } };
  await assert.rejects(repo.settleVerifiedPayment(other), /Webhook event identifier conflicts/);
  assert.equal((await repo.getOrder('ord-2'))?.status, 'created');
  assert.equal(docs.has('paymentEntitlements/ent-other'), false);
  assert.equal(await repo.settleVerifiedPayment(payment), 'duplicate');
});

test('verified full refund atomically revokes the paid pass and is idempotent', async () => {
  const { repo, docs } = fixture();
  await repo.createOrder(order);
  await repo.settleVerifiedPayment({ ...payment, entitlement: { ...entitlement, id: 'payment-ord-1' } });
  const args = {
    orderId: 'ord-1', provider: 'razorpay' as const, providerOrderId: 'gateway-1',
    providerPaymentId: 'pay-1', refundId: 'rfnd-1', eventId: 'evt-r1',
    refundAmount: 100, currency: 'INR', refundedAt: '2026-10-22T00:00:00Z',
  };
  assert.equal(await repo.recordVerifiedFullRefund(args), 'refunded');
  assert.equal((await repo.getOrder('ord-1'))?.status, 'refunded');
  assert.equal(docs.get('paymentEntitlements/payment-ord-1')?.data.status, 'revoked');
  const count = docs.size;
  assert.equal(await repo.recordVerifiedFullRefund(args), 'duplicate');
  assert.equal(docs.size, count);
});

test('partial refund, wrong payment and mismatched currency never revoke access', async () => {
  const { repo, docs } = fixture();
  await repo.createOrder(order);
  await repo.settleVerifiedPayment({ ...payment, entitlement: { ...entitlement, id: 'payment-ord-1' } });
  const args = {
    orderId: 'ord-1', provider: 'razorpay' as const, providerOrderId: 'gateway-1',
    providerPaymentId: 'pay-1', refundId: 'rfnd-2', eventId: 'evt-r2',
    refundAmount: 100, currency: 'INR', refundedAt: '2026-10-22T00:00:00Z',
  };
  for (const change of [{ refundAmount: 50 }, { currency: 'USD' }, { providerPaymentId: 'pay-other' }]) {
    await assert.rejects(repo.recordVerifiedFullRefund({ ...args, ...change }));
  }
  assert.equal((await repo.getOrder('ord-1'))?.status, 'paid');
  assert.equal(docs.get('paymentEntitlements/payment-ord-1')?.data.status, 'active');
});

test('concurrent renewals conflict on shared student cursor instead of losing paid days', async () => {
  const { repo, docs } = fixture();
  await repo.createOrder(order);
  await repo.createOrder({ ...order, orderId: 'ord-next', providerOrderId: 'gateway-next' });
  await repo.settleVerifiedPayment({ ...payment, durationDays: 365 });
  const cursor = docs.get('paymentRenewalCursors/student-1');
  assert.ok(cursor);
  assert.equal(cursor.data.expiresAt, '2027-10-21T12:00:00.000Z');
  const nextPayment = {
    ...payment, orderId: 'ord-next', providerOrderId: 'gateway-next',
    providerPaymentId: 'pay-next', eventId: 'evt-next', durationDays: 365,
    entitlement: { ...entitlement, id: 'payment-ord-next', orderId: 'ord-next', paymentId: 'pay-next' },
  };
  await repo.settleVerifiedPayment(nextPayment);
  assert.equal(docs.get('paymentRenewalCursors/student-1')?.data.expiresAt, '2028-10-20T12:00:00.000Z');
  assert.equal(docs.get('paymentEntitlements/payment-ord-next')?.data.expiresAt, '2028-10-20T12:00:00.000Z');
  assert.equal(await repo.settleVerifiedPayment(nextPayment), 'duplicate');
});

test('simultaneous renewal settlements cannot both commit against the same cursor revision', async () => {
  const { repo, docs } = fixture();
  await repo.createOrder(order);
  await repo.createOrder({ ...order, orderId: 'ord-parallel', providerOrderId: 'gateway-parallel' });
  const first = { ...payment, durationDays: 365 };
  const second = {
    ...payment, orderId: 'ord-parallel', providerOrderId: 'gateway-parallel',
    providerPaymentId: 'pay-parallel', eventId: 'evt-parallel', durationDays: 365,
    entitlement: { ...entitlement, id: 'payment-ord-parallel', orderId: 'ord-parallel',
      paymentId: 'pay-parallel' },
  };
  const results = await Promise.allSettled([
    repo.settleVerifiedPayment(first), repo.settleVerifiedPayment(second),
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter(result => result.status === 'rejected').length, 1);
  assert.equal(docs.get('paymentRenewalCursors/student-1')?.data.expiresAt, '2027-10-21T12:00:00.000Z');
  const succeededOrder = ['ord-1', 'ord-parallel'].filter(id =>
    docs.get('paymentOrders/' + id)?.data.status === 'paid');
  assert.equal(succeededOrder.length, 1);
});

test('refunding latest pass restores the prior expiry cursor atomically', async () => {
  const { repo, docs } = fixture();
  await repo.createOrder(order);
  await repo.createOrder({ ...order, orderId: 'ord-second', providerOrderId: 'gateway-second' });
  await repo.settleVerifiedPayment({ ...payment, durationDays: 365,
    entitlement: { ...entitlement, id: 'payment-ord-1' } });
  await repo.settleVerifiedPayment({
    ...payment, orderId: 'ord-second', providerOrderId: 'gateway-second',
    providerPaymentId: 'pay-second', eventId: 'evt-second', durationDays: 365,
    entitlement: { ...entitlement, id: 'payment-ord-second',
      orderId: 'ord-second', paymentId: 'pay-second' },
  });
  const refund = {
    orderId: 'ord-second', provider: 'razorpay' as const, providerOrderId: 'gateway-second',
    providerPaymentId: 'pay-second', refundId: 'rfnd-second', eventId: 'evt-refund-second',
    refundAmount: 100, currency: 'INR', refundedAt: '2026-10-22T00:00:00Z',
  };
  await assert.rejects(repo.recordVerifiedFullRefund({
    ...refund, orderId: 'ord-1', providerOrderId: 'gateway-1',
    providerPaymentId: 'pay-1', refundId: 'rfnd-first',
  }), /manual reconciliation/);
  assert.equal((await repo.getOrder('ord-1'))?.status, 'paid');
  assert.equal(await repo.recordVerifiedFullRefund(refund), 'refunded');
  assert.equal(docs.get('paymentRenewalCursors/student-1')?.data.expiresAt,
    '2027-10-21T12:00:00.000Z');
  assert.equal(docs.get('paymentEntitlements/payment-ord-second')?.data.status, 'revoked');
  assert.equal(await repo.recordVerifiedFullRefund(refund), 'duplicate');
});


const reserveAt = new Date('2026-10-21T11:55:00Z');
function couponFixture(code: string, usageLimit = 2, perUserLimit = 1) {
  const f = fixture();
  f.docs.set('coupons/' + code, { data: {
    id: code, code, enabled: true, timesUsed: 0, usageLimit,
    perUserLimit, userUsageMap: {},
  }, revision: 1 });
  return f;
}

test('precharge hold, signed settlement and duplicate webhook count coupon once', async () => {
  const { repo, docs } = couponFixture('TEST10');
  const hold = await repo.reserveCoupon({
    orderId: 'ord-1', userId: 'student-1', code: 'TEST10', discount: 10, now: reserveAt,
  });
  await repo.createOrder({ ...order, coupon: 'TEST10', discount: 10,
    couponReservationId: 'ord-1', couponReservationExpiresAt: hold.expiresAt });
  assert.equal(await repo.settleVerifiedPayment(payment), 'settled');
  assert.equal(docs.get('coupons/TEST10')?.data.timesUsed, 1);
  assert.equal(docs.get('coupons/TEST10')?.data.userUsageMap['student-1'], 1);
  assert.equal(docs.get('paymentCouponRedemptions/ord-1')?.data.discount, 10);
  assert.equal(docs.get('paymentCouponReservations/ord-1')?.data.status, 'redeemed');
  assert.equal(Object.keys(docs.get('coupons/TEST10')?.data.activeReservations).length, 0);
  assert.equal(await repo.settleVerifiedPayment(payment), 'duplicate');
  assert.equal(docs.get('coupons/TEST10')?.data.timesUsed, 1);
});

test('concurrent precharge reservations respect shared one-use capacity', async () => {
  const { repo, docs } = couponFixture('ONEUSE', 1);
  const results = await Promise.allSettled([
    repo.reserveCoupon({ orderId: 'ord-1', userId: 'student-1', code: 'ONEUSE', discount: 10, now: reserveAt }),
    repo.reserveCoupon({ orderId: 'ord-2', userId: 'student-2', code: 'ONEUSE', discount: 10, now: reserveAt }),
  ]);
  assert.equal(results.filter(x => x.status === 'fulfilled').length, 1);
  assert.equal(results.filter(x => x.status === 'rejected').length, 1);
  const winner = results[0].status === 'fulfilled' ? 'ord-1' : 'ord-2';
  assert.equal(Object.keys(docs.get('coupons/ONEUSE')?.data.activeReservations).length, 1);
  assert.ok(docs.has('paymentCouponReservations/' + winner));
});

test('abandoned checkout release reclaims capacity without incrementing usage', async () => {
  const { repo, docs } = couponFixture('SINGLE', 1);
  await repo.reserveCoupon({ orderId: 'ord-1', userId: 'student-1', code: 'SINGLE', discount: 10, now: reserveAt });
  await assert.rejects(
    repo.reserveCoupon({ orderId: 'ord-2', userId: 'student-2', code: 'SINGLE', discount: 10, now: reserveAt }),
    /capacity exhausted/,
  );
  await repo.releaseCouponReservation('ord-1', 'SINGLE');
  await repo.releaseCouponReservation('ord-1', 'SINGLE');
  assert.equal(docs.get('paymentCouponReservations/ord-1')?.data.status, 'released');
  assert.equal(docs.get('coupons/SINGLE')?.data.timesUsed, 0);
  await repo.reserveCoupon({ orderId: 'ord-2', userId: 'student-2', code: 'SINGLE', discount: 10, now: reserveAt });
  assert.equal(Object.keys(docs.get('coupons/SINGLE')?.data.activeReservations).length, 1);
});

test('expired holds are lazily reclaimed before admitting another student', async () => {
  const { repo, docs } = couponFixture('EXPIRY', 1);
  await repo.reserveCoupon({ orderId: 'ord-1', userId: 'student-1', code: 'EXPIRY', discount: 10, now: reserveAt });
  await repo.reserveCoupon({ orderId: 'ord-2', userId: 'student-2', code: 'EXPIRY',
    discount: 10, now: new Date('2026-10-21T12:26:00Z') });
  assert.equal(docs.get('coupons/EXPIRY')?.data.timesUsed, 0);
  assert.deepEqual(Object.keys(docs.get('coupons/EXPIRY')?.data.activeReservations), ['ord-2']);
});

test('same user cannot reserve twice beyond their per-user limit', async () => {
  const { repo } = couponFixture('PERUSER', 10, 1);
  await repo.reserveCoupon({ orderId: 'ord-1', userId: 'student-1', code: 'PERUSER', discount: 10, now: reserveAt });
  await assert.rejects(
    repo.reserveCoupon({ orderId: 'ord-2', userId: 'student-1', code: 'PERUSER', discount: 10, now: reserveAt }),
    /capacity exhausted/,
  );
});

test('missing, expired or mismatched hold cannot silently settle a discounted order', async () => {
  const { repo, docs } = couponFixture('STUDENT1');
  await repo.createOrder({ ...order, coupon: 'STUDENT1', discount: 10 });
  await assert.rejects(repo.settleVerifiedPayment(payment), /lacks a valid pre-charge reservation/);
  assert.equal(docs.get('paymentOrders/ord-1')?.data.status, 'created');
  const hold = await repo.reserveCoupon({
    orderId: 'ord-1', userId: 'student-1', code: 'STUDENT1',
    discount: 10, now: reserveAt,
  });
  const stored = docs.get('paymentOrders/ord-1')!;
  stored.data.couponReservationId = 'ord-1';
  stored.data.couponReservationExpiresAt = hold.expiresAt;
  docs.set('paymentOrders/ord-1', stored);
  docs.get('paymentCouponReservations/ord-1')!.data.discount = 5;
  await assert.rejects(repo.settleVerifiedPayment(payment), /missing or changed/);
  assert.equal(docs.get('paymentOrders/ord-1')?.data.status, 'created');
  assert.equal(docs.has('paymentEntitlements/ent-1'), false);
});

test('discounted order without coupon cannot grant a paid pass', async () => {
  const { repo, docs } = fixture();
  await repo.createOrder({ ...order, coupon: undefined, discount: 50 });
  await assert.rejects(repo.settleVerifiedPayment(payment), /unexplained discount/);
  assert.equal(docs.get('paymentOrders/ord-1')?.data.status, 'created');
});
