import assert from 'node:assert/strict';
import { test } from 'node:test';
import { settleVerifiedAnnualPassWebhook } from '../src/lib/payments/durableWebhookProcessor';
import type { DurablePaymentRepository } from '../src/lib/payments/durablePaymentRepository';
import type { StoredOrder, WebhookVerificationResult } from '../src/lib/payments/types';

const order: StoredOrder = {
  orderId: 'ord-test', userId: 'student-a', items: [{ title: 'Pass', unitPrice: 100, quantity: 1, annualPass: true }],
  grossAmount: 100, discount: 0, tax: 18, currency: 'INR',
  provider: 'razorpay', providerOrderId: 'rzp-order-test',
  createdAt: '2026-10-21T00:00:00Z', status: 'created',
};
const receipt: WebhookVerificationResult = {
  isValid: true, provider: 'razorpay', status: 'paid', eventId: 'evt-test',
  eventType: 'payment.captured', providerOrderId: 'rzp-order-test',
  providerPaymentId: 'pay-test', rawAmount: 118, currency: 'INR',
};
function fixture(stored: StoredOrder | null = order) {
  const writes: unknown[] = [];
  const repository = {
    getOrderByProviderOrderId: async () => stored,
    findLatestPaidPass: async () => null,
    settleVerifiedPayment: async (payload: unknown) => { writes.push(payload); return 'settled' as const; },
  } as Pick<DurablePaymentRepository, 'getOrderByProviderOrderId' | 'settleVerifiedPayment' | 'findLatestPaidPass'>;
  return { repository, writes };
}
test('verified paid event settles only for order owner with correct amount and entitlement', async () => {
  const { repository, writes } = fixture();
  assert.equal(await settleVerifiedAnnualPassWebhook(repository, receipt, 365, new Date('2026-10-21T00:00:00Z')), 'settled');
  assert.equal(writes.length, 1);
  const saved: any = writes[0];
  assert.equal(saved.entitlement.userId, 'student-a');
  assert.equal(saved.entitlement.orderId, 'ord-test');
  assert.equal(saved.entitlement.paymentId, 'pay-test');
  assert.equal(saved.entitlement.expiresAt, '2027-10-21T00:00:00.000Z');
});
test('invalid signature, non-paid status, absent IDs and mismatched amounts never settle', async () => {
  const { repository, writes } = fixture();
  for (const change of [
    { isValid: false }, { status: 'pending' as const }, { providerOrderId: '' },
    { providerPaymentId: '' }, { eventId: '' }, { rawAmount: 1 },
    { rawAmount: NaN }, { currency: 'USD' },
  ]) await assert.rejects(settleVerifiedAnnualPassWebhook(repository, { ...receipt, ...change }, 365));
  assert.equal(writes.length, 0);
});
test('unknown orders remain retryable and do not issue entitlements', async () => {
  const { repository, writes } = fixture(null);
  assert.equal(await settleVerifiedAnnualPassWebhook(repository, receipt, 365), 'unknown_order');
  assert.equal(writes.length, 0);
});
test('non-pass orders and invalid pass duration cannot provision annual access', async () => {
  const { repository, writes } = fixture({ ...order, items: [{ title: 'Notes', unitPrice: 100, quantity: 1 }] });
  await assert.rejects(settleVerifiedAnnualPassWebhook(repository, receipt, 365), /exactly one authoritative Annual Pass/);
  await assert.rejects(settleVerifiedAnnualPassWebhook(repository, receipt, 0), /duration/);
  assert.equal(writes.length, 0);
});

test('mixed carts, multiplied passes and altered gross values cannot grant a pass', async () => {
  for (const invalidItems of [
    [{ title: 'Pass', unitPrice: 100, quantity: 1, annualPass: true },
      { title: 'Notes', unitPrice: 20, quantity: 1 }],
    [{ title: 'Pass', unitPrice: 100, quantity: 2, annualPass: true }],
    [{ title: 'Pass', unitPrice: 1, quantity: 1, annualPass: true }],
    [],
  ]) {
    const { repository, writes } = fixture({ ...order, items: invalidItems });
    await assert.rejects(settleVerifiedAnnualPassWebhook(repository, receipt, 365), /exactly one authoritative Annual Pass/);
    assert.equal(writes.length, 0);
  }
});

test('early renewal extends from previous pass expiry instead of purchase date', async () => {
  const { repository, writes } = fixture();
  repository.findLatestPaidPass = async () => ({
    id: 'old', userId: 'student-a', type: 'annual_pass', status: 'active',
    startsAt: '2026-01-01T00:00:00Z', expiresAt: '2027-01-01T00:00:00Z',
    grantedBy: 'payment', orderId: 'old-order', paymentId: 'old-pay',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  });
  await settleVerifiedAnnualPassWebhook(repository, receipt, 365, new Date('2026-10-21T00:00:00Z'));
  assert.equal((writes[0] as any).entitlement.expiresAt, '2028-01-01T00:00:00.000Z');
});
