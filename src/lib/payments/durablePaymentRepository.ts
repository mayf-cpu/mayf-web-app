/**
 * Durable payment persistence primitives. Not wired to checkout until the
 * provider, coupon redemption and entitlement flows are transaction-safe.
 * Firestore commit preconditions ensure concurrent workers cannot settle twice.
 */
import { FirestoreDocumentStore } from '../firebase/documentStore';
import type { StoredOrder, Entitlement, PaymentProvider } from './types';

const ORDER_COLLECTION = 'paymentOrders';
const EVENT_COLLECTION = 'paymentWebhookEvents';
const ENTITLEMENT_COLLECTION = 'paymentEntitlements';

function validId(value: string): string {
  if (!value || value.includes('/') || value.length > 400) throw new Error('Invalid payment record identifier');
  return value;
}

export class DurablePaymentRepository {
  constructor(private readonly store: FirestoreDocumentStore) {}

  async createOrder(order: StoredOrder): Promise<void> {
    if (order.status !== 'created' && order.status !== 'pending') throw new Error('New payment order cannot be settled');
    await this.store.commit([{
      collection: ORDER_COLLECTION, id: validId(order.orderId),
      data: { ...order },
    }]);
  }

  async getOrder(orderId: string): Promise<StoredOrder | null> {
    const doc = await this.store.collection(ORDER_COLLECTION).doc(validId(orderId)).get();
    return doc.exists ? doc.data() as StoredOrder : null;
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
    const eventKey = validId(provider + ':' + eventId);
    const eventRef = await this.store.collection(EVENT_COLLECTION).doc(eventKey).get();
    if (eventRef.exists) return 'duplicate';

    const orderRef = await this.store.collection(ORDER_COLLECTION).doc(validId(orderId)).get();
    if (!orderRef.exists) throw new Error('Payment order not found');
    const order = orderRef.data() as StoredOrder;
    if (order.provider !== provider || order.providerOrderId !== providerOrderId || order.userId !== entitlement.userId ||
        entitlement.orderId !== orderId || entitlement.paymentId !== providerPaymentId) {
      throw new Error('Verified payment does not match stored order or entitlement');
    }
    if (order.status === 'paid') return 'duplicate';
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
    ]);
    return 'settled';
  }
}
