import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PaymentService } from '../src/lib/payments/paymentService';
import { RazorpayAdapter } from '../src/lib/payments/adapters/razorpayAdapter';
import type { StoredOrder } from '../src/lib/payments/types';

const request = {
  userId: 'student-qa', items: [{ id: 'pass', title: 'Annual Pass', unitPrice: 999, quantity: 1, annualPass: true }],
  grossAmount: 999, currency: 'INR' as const, preferredProvider: 'razorpay' as const,
};
const result = { provider: 'razorpay' as const, providerOrderId: 'order_sandbox',
  amountInSubunits: 99900, currency: 'INR', keyId: 'rzp_test_only' };

test('durable order is written before checkout response and retains owner', async t => {
  t.mock.method(RazorpayAdapter.prototype, 'createOrder', async () => result);
  const writes: StoredOrder[] = [];
  const service = new PaymentService({ createOrder: async order => { writes.push({ ...order }); } });
  const checkout = await service.createOrder(request);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].userId, 'student-qa');
  assert.equal(writes[0].providerOrderId, 'order_sandbox');
  assert.equal(checkout.order.orderId, writes[0].orderId);
});

test('storage errors fail the checkout instead of reporting successful purchase', async t => {
  t.mock.method(RazorpayAdapter.prototype, 'createOrder', async () => result);
  const service = new PaymentService({ createOrder: async () => { throw new Error('Firestore unavailable'); } });
  await assert.rejects(service.createOrder(request), /Firestore unavailable/);
  assert.equal(service.getAllOrders().filter(o => o.userId === 'student-qa').length, 0);
});

test('production refuses checkout when no durable storage is configured', async t => {
  t.mock.method(RazorpayAdapter.prototype, 'createOrder', async () => result);
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const service = new PaymentService();
    await assert.rejects(service.createOrder(request), /durable order storage is not configured/);
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});


test('invalid coupon is rejected before creating a chargeable gateway order', async t => {
  const gateway = t.mock.method(RazorpayAdapter.prototype, 'createOrder', async () => result);
  const service = new PaymentService();
  await assert.rejects(
    service.createOrder({ ...request, coupon: 'INVALID_CODE_DOES_NOT_EXIST' }),
    /Coupon not applicable:/,
  );
  assert.equal(gateway.mock.callCount(), 0);
  assert.equal(service.getUserOrders(request.userId).length, 0);
});

test('only the validated coupon is persisted with its authoritative discount', async t => {
  t.mock.method(RazorpayAdapter.prototype, 'createOrder', async () => result);
  const service = new PaymentService({ createOrder: async () => undefined });
  const created = await service.createOrder({ ...request, coupon: 'board2026' });
  assert.equal(created.order.coupon, 'BOARD2026');
  assert.equal(created.order.discount, 100);
});
