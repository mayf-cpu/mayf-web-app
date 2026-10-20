/**
 * Durable webhook settlement orchestration (not yet connected to live routes).
 * Call only with an adapter's cryptographically verified webhook result.
 * No client-provided order ID, price or entitlement is trusted.
 */
import type { DurablePaymentRepository } from './durablePaymentRepository';
import type { Entitlement, StoredOrder, WebhookVerificationResult } from './types';

export interface PaidWebhookReceipt extends WebhookVerificationResult {
  isValid: true;
  status: 'paid';
  providerOrderId: string;
  providerPaymentId: string;
  rawAmount: number;
  currency: string;
}

function requirePaidReceipt(receipt: WebhookVerificationResult): asserts receipt is PaidWebhookReceipt {
  if (!receipt.isValid || receipt.status !== 'paid') throw new Error('Webhook is not a verified paid event');
  if (!receipt.providerOrderId?.trim() || !receipt.providerPaymentId?.trim() || !receipt.eventId?.trim()) {
    throw new Error('Verified gateway transaction identifiers are required');
  }
  if (!Number.isFinite(receipt.rawAmount) || receipt.rawAmount! < 0 || !receipt.currency?.trim()) {
    throw new Error('Verified gateway amount and currency are required');
  }
}

export async function settleVerifiedAnnualPassWebhook(
  repository: Pick<DurablePaymentRepository, 'getOrderByProviderOrderId' | 'settleVerifiedPayment'>,
  receipt: WebhookVerificationResult,
  durationDays: number,
  now = new Date(),
): Promise<'settled' | 'duplicate' | 'unknown_order'> {
  requirePaidReceipt(receipt);
  if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 3650) {
    throw new Error('Invalid annual pass duration');
  }
  const order: StoredOrder | null = await repository.getOrderByProviderOrderId(receipt.provider, receipt.providerOrderId);
  if (!order) return 'unknown_order'; // gateway should retry, not get a successful acknowledgment
  if (order.provider !== receipt.provider || order.providerOrderId !== receipt.providerOrderId) {
    throw new Error('Provider order mismatch');
  }
  if (!order.items.some(item => item.annualPass === true)) {
    throw new Error('This webhook processor only supports annual pass orders');
  }
  const expectedSubunits = Math.round((order.grossAmount - order.discount + (order.tax || 0)) * 100);
  if (!Number.isSafeInteger(expectedSubunits) || expectedSubunits <= 0 ||
      Math.round(receipt.rawAmount * 100) !== expectedSubunits ||
      receipt.currency.toUpperCase() !== order.currency.toUpperCase()) {
    throw new Error('Gateway amount or currency does not match authoritative order');
  }
  const started = now.toISOString();
  const expires = new Date(now.getTime() + durationDays * 86400000).toISOString();
  const entitlement: Entitlement = {
    id: 'payment-' + order.orderId,
    userId: order.userId,
    type: 'annual_pass',
    startsAt: started,
    expiresAt: expires,
    status: 'active',
    grantedBy: 'payment',
    orderId: order.orderId,
    paymentId: receipt.providerPaymentId,
    createdAt: started,
    updatedAt: started,
  };
  return repository.settleVerifiedPayment({
    orderId: order.orderId, provider: order.provider,
    providerOrderId: order.providerOrderId, providerPaymentId: receipt.providerPaymentId,
    eventId: receipt.eventId, entitlement, paidAt: started,
  });
}
