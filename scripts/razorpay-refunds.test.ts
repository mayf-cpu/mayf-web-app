import assert from 'node:assert/strict';
import { test } from 'node:test';
import { processVerifiedRazorpayFullRefund } from '../src/lib/payments/durableRefundProcessor';
import type { DurablePaymentRepository } from '../src/lib/payments/durablePaymentRepository';
import type { WebhookVerificationResult, StoredOrder } from '../src/lib/payments/types';

const verified: WebhookVerificationResult = {
  isValid: true, provider: 'razorpay', eventType: 'refund.processed',
  eventId: 'evt-refund', status: 'pending',
};
const order: StoredOrder = {
  orderId: 'ord-1', userId: 'student-a', provider: 'razorpay',
  providerOrderId: 'order-gw', providerPaymentId: 'pay-gw',
  status: 'paid', grossAmount: 100, discount: 0, currency: 'INR',
  items: [], createdAt: '2026-10-21T00:00:00Z',
};
const signedPayload = (refund: Record<string, unknown>) => JSON.stringify({
  event: 'refund.processed', payload: { refund: { entity: refund } },
});
const valid = { id: 'rfnd-1', payment_id: 'pay-gw', amount: 10000, currency: 'INR', status: 'processed' };
function fixture(found: StoredOrder | null = order) {
  const writes: any[] = [];
  const repo = {
    getOrderByProviderPaymentId: async (_provider: string, id: string) => id === 'pay-gw' ? found : null,
    recordVerifiedFullRefund: async (args: any) => { writes.push(args); return 'refunded' as const; },
  } as Pick<DurablePaymentRepository, 'getOrderByProviderPaymentId' | 'recordVerifiedFullRefund'>;
  return { repo, writes };
}
test('signed processed Razorpay refund reaches atomic Firestore reconciliation with amount and currency', async () => {
  const { repo, writes } = fixture();
  const status = await processVerifiedRazorpayFullRefund(repo, verified, signedPayload(valid));
  assert.equal(status, 'refunded');
  assert.equal(writes.length, 1);
  assert.equal(writes[0].refundAmount, 100);
  assert.equal(writes[0].currency, 'INR');
  assert.equal(writes[0].providerPaymentId, 'pay-gw');
});
test('unauthenticated and malformed refund events fail before any writes', async () => {
  const { repo, writes } = fixture();
  for (const change of [{ isValid: false }, { eventType: 'refund.created' }, { eventId: '' }])
    await assert.rejects(processVerifiedRazorpayFullRefund(repo, { ...verified, ...change }, signedPayload(valid)));
  for (const bad of [
    { ...valid, id: '' }, { ...valid, payment_id: '' }, { ...valid, status: 'created' },
    { ...valid, currency: null }, { ...valid, amount: 0 }, { ...valid, amount: 1.5 },
  ]) await assert.rejects(processVerifiedRazorpayFullRefund(repo, verified, signedPayload(bad)));
  await assert.rejects(processVerifiedRazorpayFullRefund(repo, verified, 'not-json'));
  assert.equal(writes.length, 0);
});
test('unknown refunded payment stays retryable and is not acknowledged as processed', async () => {
  const { repo, writes } = fixture(null);
  assert.equal(await processVerifiedRazorpayFullRefund(repo, verified, signedPayload(valid)), 'unknown_order');
  assert.equal(writes.length, 0);
});
