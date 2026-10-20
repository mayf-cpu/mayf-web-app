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
  }): Promise<'settled' | 'duplicate'> {
    const { orderId, provider, providerOrderId, providerPaymentId, eventId, entitlement, paidAt } = args;
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

    const entitlementId = validId(entitlement.id);
    const entitlementRef = await this.store.collection(ENTITLEMENT_COLLECTION).doc(entitlementId).get();
    if (entitlementRef.exists) throw new Error('Entitlement ID already exists');

    await this.store.commit([
      { collection: ORDER_COLLECTION, id: validId(orderId),
        data: { ...order, status: 'paid', paidAt, providerPaymentId }, updateTime: orderRef.updateTime },
      { collection: EVENT_COLLECTION, id: eventKey,
        data: { provider, eventId, orderId, providerOrderId, providerPaymentId, processedAt: paidAt } },
      { collection: ENTITLEMENT_COLLECTION, id: entitlementId, data: { ...entitlement } },
      { collection: PAYMENT_CLAIM_COLLECTION, id: paymentClaimId,
        data: { provider, providerPaymentId, orderId, createdAt: paidAt } },
    ]);
    return 'settled';
  }
}
