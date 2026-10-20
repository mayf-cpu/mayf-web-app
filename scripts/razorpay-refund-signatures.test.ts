import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { test } from 'node:test';
import { RazorpayAdapter } from '../src/lib/payments/adapters/razorpayAdapter';
import { processVerifiedRazorpayFullRefund } from '../src/lib/payments/durableRefundProcessor';
import type { DurablePaymentRepository } from '../src/lib/payments/durablePaymentRepository';

test('real adapter HMAC verification gates refund reconciliation', async () => {
  const secret = 'test-only-hmac-key';
  const adapter = new RazorpayAdapter({ webhookSecret: secret });
  const raw = JSON.stringify({ event: 'refund.processed',
    payload: { refund: { entity: {
      id: 'rfnd-integration', payment_id: 'pay-integration', currency: 'INR',
      amount: 11800, status: 'processed',
    } } },
  });
  const sig = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  const verified = await adapter.verifyWebhook({ 'x-razorpay-signature': sig, 'x-razorpay-event-id': 'evt-integration' }, raw);
  assert.equal(verified.isValid, true);
  let writes = 0;
  const repo = {
    getOrderByProviderPaymentId: async () => ({
      orderId: 'o1', userId: 'u1', provider: 'razorpay' as const,
      providerOrderId: 'gw-o1', providerPaymentId: 'pay-integration',
      status: 'paid' as const, currency: 'INR', grossAmount: 100, discount: 0,
      tax: 18, items: [], createdAt: '2026-10-21T00:00:00Z',
    }),
    recordVerifiedFullRefund: async (args: {refundAmount: number}) => {
      assert.equal(args.refundAmount, 118); writes++; return 'refunded' as const;
    },
  } as Pick<DurablePaymentRepository, 'getOrderByProviderPaymentId'|'recordVerifiedFullRefund'>;
  assert.equal(await processVerifiedRazorpayFullRefund(repo, verified, raw), 'refunded');
  const invalid = await adapter.verifyWebhook({ 'x-razorpay-signature': '0'.repeat(64) }, raw);
  await assert.rejects(processVerifiedRazorpayFullRefund(repo, invalid, raw), /authenticated Razorpay/);
  assert.equal(writes, 1);
});
