/**
 * Durable payment persistence primitives. Not wired to checkout until the
 * provider, coupon redemption and entitlement flows are transaction-safe.
 * Firestore commit preconditions ensure concurrent workers cannot settle twice.
 */
import { FirestoreDocumentStore } from '../firebase/documentStore';
import type { StoredOrder, Entitlement, PaymentProvider } from './types';

const ORDER_COLLECTION = 'paymentOrders';
const PROVIDER_ORDER_COLLECTION = 'paymentProviderOrders';
const EVENT_COLLECTION = 'paymentWebhookEvents';
const PAYMENT_CLAIM_COLLECTION = 'paymentProviderClaims';
const ENTITLEMENT_COLLECTION = 'paymentEntitlements';

function validId(value: string): string {
  if (!value || value.includes('/') || value.length > 400) throw new Error('Invalid payment record identifier');
  return value;
}

export class DurablePaymentRepository {
  constructor(private readonly store: FirestoreDocumentStore) {}

  async createOrder(order: StoredOrder): Promise<void> {
    if (order.status !== 'created' && order.status !== 'pending') throw new Error('New payment order cannot be settled');
    if (!order.providerOrderId?.trim()) throw new Error('Gateway order identifier is required');
    const providerKey = validId(order.provider + ':' + order.providerOrderId);
    await this.store.commit([
      { collection: ORDER_COLLECTION, id: validId(order.orderId), data: { ...order } },
      { collection: PROVIDER_ORDER_COLLECTION, id: providerKey,
        data: { orderId: order.orderId, provider: order.provider, providerOrderId: order.providerOrderId } },
    ]);
  }

  /** Resolve a captured payment from the globally unique provider payment claim. */
  async getOrderByProviderPaymentId(provider: PaymentProvider, providerPaymentId: string): Promise<StoredOrder | null> {
    const claimId = validId(provider + ':' + validId(providerPaymentId));
    const claim = await this.store.collection(PAYMENT_CLAIM_COLLECTION).doc(claimId).get();
    if (!claim.exists) return null;
    const data = claim.data();
    if (typeof data?.orderId !== 'string' || data?.provider !== provider ||
        data?.providerPaymentId !== providerPaymentId) {
      throw new Error('Payment claim does not match provider transaction');
    }
    const order = await this.getOrder(data.orderId);
    if (!order || order.provider !== provider || order.providerPaymentId !== providerPaymentId) {
      throw new Error('Payment claim does not match persisted order');
    }
    return order;
  }

  /**
   * Record a cryptographically verified FULL refund and revoke the associated
   * pass atomically. Gateway signature and refund amount must be verified upstream.
   * Partial refunds are intentionally unsupported and must not revoke access.
   */
  async recordVerifiedFullRefund(args: {
    orderId: string; provider: PaymentProvider; providerOrderId: string;
    providerPaymentId: string; refundId: string; eventId: string;
    refundAmount: number; currency: string; refundedAt: string;
  }): Promise<'refunded' | 'duplicate'> {
    const { orderId, provider, providerOrderId, providerPaymentId, refundId, eventId,
      refundAmount, currency, refundedAt } = args;
    for (const value of [orderId, providerOrderId, providerPaymentId, refundId, eventId]) validId(value);
    const refundKey = validId(provider + ':refund:' + refundId);
    const ref = await this.store.collection(EVENT_COLLECTION).doc(refundKey).get();
    if (ref.exists) {
      const data = ref.data();
      if (data?.orderId === orderId && data?.providerPaymentId === providerPaymentId &&
          data?.refundId === refundId) return 'duplicate';
      throw new Error('Refund identifier conflicts with an existing transaction');
    }
    const orderRef = await this.store.collection(ORDER_COLLECTION).doc(validId(orderId)).get();
    if (!orderRef.exists || !orderRef.updateTime) throw new Error('Refund order missing or revision unavailable');
    const order = orderRef.data() as StoredOrder;
    if (order.status !== 'paid' || order.provider !== provider ||
        order.providerOrderId !== providerOrderId || order.providerPaymentId !== providerPaymentId) {
      throw new Error('Refund does not match a paid order');
    }
    const payable = Math.round((order.grossAmount - order.discount + (order.tax || 0)) * 100);
    if (!Number.isSafeInteger(payable) || payable <= 0 || !Number.isFinite(refundAmount) ||
        Math.round(refundAmount * 100) !== payable || currency.toUpperCase() !== order.currency.toUpperCase()) {
      throw new Error('Only a verified full refund matching order amount and currency is supported');
    }
    const entitlementId = validId('payment-' + orderId);
    const passRef = await this.store.collection(ENTITLEMENT_COLLECTION).doc(entitlementId).get();
    if (!passRef.exists || !passRef.updateTime) throw new Error('Paid entitlement missing or revision unavailable');
    const pass = passRef.data() as Entitlement;
    if (pass.orderId !== orderId || pass.userId !== order.userId || pass.paymentId !== providerPaymentId ||
        pass.status !== 'active') throw new Error('Refund entitlement does not match the order');
    await this.store.commit([
      { collection: ORDER_COLLECTION, id: validId(orderId), updateTime: orderRef.updateTime,
        data: { ...order, status: 'refunded', refundedAt, refundId } },
      { collection: ENTITLEMENT_COLLECTION, id: entitlementId, updateTime: passRef.updateTime,
        data: { ...pass, status: 'revoked', updatedAt: refundedAt, notes: 'Revoked after verified full refund' } },
      { collection: EVENT_COLLECTION, id: refundKey,
        data: { provider, orderId, providerPaymentId, refundId, eventId, processedAt: refundedAt } },
    ]);
    return 'refunded';
  }

  /** Find the furthest active paid-pass expiry for renewal calculation. */
  async findLatestPaidPass(userId: string): Promise<Entitlement | null> {
    if (!userId?.trim()) throw new Error('Student identifier is required');
    const docs = await this.store.queryEqual(ENTITLEMENT_COLLECTION, 'userId', userId);
    const matches = docs.map(doc => doc.data as Entitlement)
      .filter(pass => pass.userId === userId && pass.type === 'annual_pass' &&
        pass.status === 'active' && Number.isFinite(Date.parse(pass.expiresAt)))
      .sort((a, b) => Date.parse(b.expiresAt) - Date.parse(a.expiresAt));
    return matches[0] || null;
  }

  async getOrder(orderId: string): Promise<StoredOrder | null> {
    const doc = await this.store.collection(ORDER_COLLECTION).doc(validId(orderId)).get();
    return doc.exists ? doc.data() as StoredOrder : null;
  }

  /** Resolve a verified webhook's provider order ID without relying on isolate memory. */
  async getOrderByProviderOrderId(provider: PaymentProvider, providerOrderId: string): Promise<StoredOrder | null> {
    const key = validId(provider + ':' + validId(providerOrderId));
    const index = await this.store.collection(PROVIDER_ORDER_COLLECTION).doc(key).get();
    if (!index.exists) return null;
    const id = index.data()?.orderId;
    if (typeof id !== 'string') throw new Error('Corrupt payment provider order index');
    const order = await this.getOrder(id);
    if (!order || order.provider !== provider || order.providerOrderId !== providerOrderId) {
      throw new Error('Payment provider order index does not match persisted order');
    }
    return order;
  }

  /**
   * Store the paid order, payment event, and resulting entitlement atomically.
   * Requires a verified provider signature BEFORE invocation; this is persistence
   * only and MUST NOT be used to authorize unverified callbacks.
   */
  async settleVerifiedPayment(args: {
    orderId: string;
    provider: PaymentProvider;
    providerOrderId: string;
    providerPaymentId: string;
    eventId: string;
    entitlement: Entitlement;
    paidAt: string;
    durationDays?: number;
  }): Promise<'settled' | 'duplicate'> {
    const { orderId, provider, providerOrderId, providerPaymentId, eventId, entitlement, paidAt, durationDays } = args;
    if (!orderId?.trim() || !providerOrderId?.trim() || !providerPaymentId?.trim() || !eventId?.trim()) {
      throw new Error('Verified payment identifiers are required');
    }
    const eventKey = validId(provider + ':' + eventId);
    // A provider transaction must be credited to at most one order, even if
    // the gateway sends different event IDs for the same payment.
    const paymentClaimId = validId(provider + ':' + providerPaymentId);
    const eventRef = await this.store.collection(EVENT_COLLECTION).doc(eventKey).get();
    if (eventRef.exists) {
      const recorded = eventRef.data();
      if (recorded?.orderId === orderId && recorded?.provider === provider &&
          recorded?.providerOrderId === providerOrderId &&
          recorded?.providerPaymentId === providerPaymentId) return 'duplicate';
      throw new Error('Webhook event identifier conflicts with another payment');
    }

    const existingClaim = await this.store.collection(PAYMENT_CLAIM_COLLECTION).doc(paymentClaimId).get();
    if (existingClaim.exists) {
      const claim = existingClaim.data();
      if (claim?.orderId === orderId && claim?.providerOrderId === providerOrderId &&
          claim?.providerPaymentId === providerPaymentId) return 'duplicate';
      throw new Error('Provider payment claim conflicts with this order');
    }

    const orderRef = await this.store.collection(ORDER_COLLECTION).doc(validId(orderId)).get();
    if (!orderRef.exists) throw new Error('Payment order not found');
    const order = orderRef.data() as StoredOrder;
    if (order.provider !== provider || order.providerOrderId !== providerOrderId || order.userId !== entitlement.userId ||
        entitlement.orderId !== orderId || entitlement.paymentId !== providerPaymentId) {
      throw new Error('Verified payment does not match stored order or entitlement');
    }
    if (order.status === 'paid') {
      if (order.providerPaymentId === providerPaymentId) return 'duplicate';
      throw new Error('Order already paid with a different transaction');
    }
    if (!orderRef.updateTime) throw new Error('Order revision unavailable; cannot safely settle payment');
    if (order.status !== 'created' && order.status !== 'pending') throw new Error('Order is not payable');

    // One per-student revision is a serialization point for concurrent renewals.
    // Never commit a pass based on a stale expiry value.
    const cursorId = validId(order.userId);
    const cursorRef = await this.store.collection(RENEWAL_CURSOR_COLLECTION).doc(cursorId).get();
    const cursor = cursorRef.exists ? cursorRef.data() : undefined;
    const paidMs = Date.parse(paidAt);
    const proposedMs = Date.parse(entitlement.expiresAt);
    const startsMs = Date.parse(entitlement.startsAt);
    if (!Number.isFinite(paidMs) || !Number.isFinite(proposedMs) ||
        !Number.isFinite(startsMs) || proposedMs <= paidMs) {
      throw new Error('Invalid renewal entitlement dates');
    }
    // The orchestrator supplies the pass duration. Compute the expiry again
    // from the cursor, preserving remaining time on the student's paid pass.
    const termMs = durationDays === undefined ? proposedMs - startsMs : durationDays * 86400000;
    if (!Number.isSafeInteger(termMs) || termMs <= 0) throw new Error('Invalid pass term');
    const cursorExpiryMs = cursor?.expiresAt ? Date.parse(cursor.expiresAt) : NaN;
    if (cursor && (!Number.isFinite(cursorExpiryMs) || !cursorRef.updateTime)) {
      throw new Error('Renewal cursor is corrupt or missing its revision');
    }
    const baseMs = Math.max(paidMs, Number.isFinite(cursorExpiryMs) ? cursorExpiryMs : paidMs);
    const expiresAt = new Date(baseMs + termMs).toISOString();
    const finalEntitlement = { ...entitlement, expiresAt };
    const entitlementId = validId(entitlement.id);
    const entitlementRef = await this.store.collection(ENTITLEMENT_COLLECTION).doc(entitlementId).get();
    if (entitlementRef.exists) throw new Error('Entitlement ID already exists');

    await this.store.commit([
      { collection: ORDER_COLLECTION, id: validId(orderId),
        data: { ...order, status: 'paid', paidAt, providerPaymentId }, updateTime: orderRef.updateTime },
      { collection: EVENT_COLLECTION, id: eventKey,
        data: { provider, eventId, orderId, providerOrderId, providerPaymentId, processedAt: paidAt } },
      { collection: ENTITLEMENT_COLLECTION, id: entitlementId, data: finalEntitlement },
      { collection: RENEWAL_CURSOR_COLLECTION, id: cursorId,
        ...(cursorRef.updateTime ? { updateTime: cursorRef.updateTime } : {}),
        data: { userId: order.userId, expiresAt, lastOrderId: orderId, updatedAt: paidAt } },
      { collection: PAYMENT_CLAIM_COLLECTION, id: paymentClaimId,
        data: { provider, providerPaymentId, orderId, createdAt: paidAt } },
    ]);
    return 'settled';
  }
}
