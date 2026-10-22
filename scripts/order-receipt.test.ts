import assert from 'node:assert/strict';
import test from 'node:test';
import { orderReceipt } from '../src/lib/payments/orderReceipt';
import type { StoredOrder } from '../src/lib/payments/types';
const order: StoredOrder = { orderId: 'order-1', userId: 'owner', status: 'paid', provider: 'razorpay',
  providerOrderId: 'order_provider', providerPaymentId: 'pay_provider', grossAmount: 1234.5, discount: 100.25,
  tax: 204.17, currency: 'INR', createdAt: '2026-10-22T00:00:00Z', paidAt: '2026-10-22T00:01:00Z',
  items: [{ id: 'pass', title: 'Annual Pass', quantity: 1, unitPrice: 1234.5 }] };
test('receipt reflects recorded payment, currency, tax and dates without sample legal identifiers', () => {
  const receipt = orderReceipt(order, 'owner');
  assert.match(receipt, /Total payment: INR 1338.42/); assert.match(receipt, /2026-10-22T00:01:00.000Z/);
  assert.doesNotMatch(receipt, /GSTIN|BOARD2026|899|Arjun|Guarantee/);
  assert.match(orderReceipt({ ...order, status: 'refunded' }, 'owner'), /Current order status: refunded/);
});
test('receipts reject another account, unpaid orders, missing payment or corrupted amounts', () => {
  assert.throws(() => orderReceipt(order, 'another-user'));
  for (const patch of [{ status: 'pending' }, { providerPaymentId: '' }, { paidAt: '' }, { tax: NaN }, { discount: 9000 }]) {
    assert.throws(() => orderReceipt({ ...order, ...patch } as StoredOrder, 'owner'));
  }
});
