/**
 * Full-refund reconciliation from an already HMAC-verified Razorpay webhook.
 * The raw body must be the exact payload passed to RazorpayAdapter.verifyWebhook.
 * Partial refunds and missing/ambiguous gateway fields never revoke access.
 */
import type { DurablePaymentRepository } from './durablePaymentRepository';
import type { WebhookVerificationResult } from './types';

export async function processVerifiedRazorpayFullRefund(
  repository: Pick<DurablePaymentRepository, 'getOrderByProviderPaymentId' | 'recordVerifiedFullRefund'>,
  verified: WebhookVerificationResult,
  rawPayload: string | Buffer,
  now = new Date(),
): Promise<'refunded' | 'duplicate' | 'unknown_order'> {
  if (!verified.isValid || verified.provider !== 'razorpay' ||
      verified.eventType !== 'refund.processed' || !verified.eventId?.trim()) {
    throw new Error('Expected an authenticated Razorpay refund.processed event');
  }
  let payload: any;
  try {
    payload = JSON.parse(Buffer.isBuffer(rawPayload) ? rawPayload.toString('utf8') : rawPayload);
  } catch {
    throw new Error('Malformed signed Razorpay refund payload');
  }
  if (payload?.event !== verified.eventType) throw new Error('Signed event type mismatch');
  const refund = payload?.payload?.refund?.entity;
  const id = refund?.id;
  const paymentId = refund?.payment_id;
  const currency = refund?.currency;
  const amount = refund?.amount;
  if (typeof id !== 'string' || !id.trim() ||
      typeof paymentId !== 'string' || !paymentId.trim() ||
      typeof currency !== 'string' || !currency.trim() ||
      !Number.isSafeInteger(amount) || amount <= 0 ||
      refund?.status !== 'processed') {
    throw new Error('Signed refund has missing, incomplete or unsupported transaction fields');
  }
  const order = await repository.getOrderByProviderPaymentId('razorpay', paymentId);
  if (!order) return 'unknown_order';
  return repository.recordVerifiedFullRefund({
    orderId: order.orderId,
    provider: 'razorpay',
    providerOrderId: order.providerOrderId,
    providerPaymentId: paymentId,
    refundId: id,
    eventId: verified.eventId,
    refundAmount: amount / 100,
    currency,
    refundedAt: now.toISOString(),
  });
}
