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
const RENEWAL_CURSOR_COLLECTION = 'paymentRenewalCursors';
const COUPON_COLLECTION = 'coupons';
const COUPON_REDEMPTION_COLLECTION = 'paymentCouponRedemptions';
const COUPON_RESERVATION_COLLECTION = 'paymentCouponReservations';
const COUPON_HOLD_MS = 30 * 60_000;

function validId(value: string): string {
  if (!value || value.includes('/') || value.length > 400) throw new Error('Invalid payment record identifier');
  return value;
}

export class DurablePaymentRepository {
  constructor(private readonly store: FirestoreDocumentStore) {}

  /**
   * Reserve a real discount BEFORE creating a chargeable gateway order.
   * The coupon document is a shared optimistic-concurrency serialization point.
   * Expired holds are reclaimed lazily as part of the next reservation.
   */
  async reserveCoupon(args: {
    orderId: string; userId: string; code: string; discount: number;
    expectedUpdatedAt?: string; now?: Date;
  }): Promise<{ expiresAt: string }> {
    const { orderId, userId, discount } = args;
    validId(orderId); validId(userId);
    const code = args.code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{1,64}$/.test(code) ||
        !Number.isFinite(discount) || discount <= 0) {
      throw new Error('Invalid coupon reservation');
    }
    const nowMs = (args.now || new Date()).getTime();
    if (!Number.isFinite(nowMs)) throw new Error('Invalid reservation time');
    const couponRef = await this.store.collection(COUPON_COLLECTION).doc(code).get();
    if (!couponRef.exists || !couponRef.updateTime) throw new Error('Coupon not available for reservation');
    const coupon = couponRef.data();
    if (!coupon || coupon.code !== code || !coupon.enabled ||
        !Number.isSafeInteger(coupon.timesUsed) || coupon.timesUsed < 0 ||
        !coupon.userUsageMap || typeof coupon.userUsageMap !== 'object') {
      throw new Error('Coupon is disabled or corrupt');
    }
    // A quote crossing the coupon's validity window must be rejected even
    // when no administrator edited the coupon during checkout.
    const startsMs = coupon.startDate ? Date.parse(coupon.startDate) : -Infinity;
    const endsMs = coupon.endDate
      ? Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(coupon.endDate)
        ? coupon.endDate + 'T23:59:59.999Z' : coupon.endDate)
      : Infinity;
    if ((coupon.startDate && !Number.isFinite(startsMs)) ||
        (coupon.endDate && !Number.isFinite(endsMs)) ||
        nowMs < startsMs || nowMs > endsMs) {
      throw new Error('Coupon validity period ended before checkout reservation');
    }
    if (args.expectedUpdatedAt && coupon.updatedAt !== args.expectedUpdatedAt) {
      throw new Error('Coupon terms changed since quote; please recalculate discount');
    }
    const holds = coupon.activeReservations || {};
    if (typeof holds !== 'object' || Array.isArray(holds)) throw new Error('Invalid coupon reservation ledger');
    const active: Record<string, { userId: string; discount: number; expiresAt: string }> = {};
    for (const [key, value] of Object.entries(holds) as [string, any][]) {
      if (!value || typeof value.userId !== 'string' ||
          !Number.isFinite(Date.parse(value.expiresAt)) ||
          !Number.isFinite(value.discount)) throw new Error('Invalid coupon hold');
      if (Date.parse(value.expiresAt) > nowMs) {
        active[key] = value;
      } else {
        // An expired timer is NOT evidence that the payment gateway cancelled
        // its chargeable order. Never reallocate capacity tied to an
        // unresolved persisted checkout.
        const orderDoc = await this.store.collection(ORDER_COLLECTION).doc(validId(key)).get();
        const existingOrder = orderDoc.exists ? orderDoc.data() as StoredOrder : null;
        if (existingOrder && (existingOrder.status === 'created' || existingOrder.status === 'pending')) {
          active[key] = value;
        }
      }
    }
    if (active[orderId]) throw new Error('This order already has a coupon reservation');
    if (Object.keys(active).length >= 100) throw new Error('Coupon reservation capacity is temporarily full');
    const userCount = coupon.userUsageMap[userId] || 0;
    if (!Number.isSafeInteger(userCount) || userCount < 0) throw new Error('Invalid student redemption count');
    const globalLimit = coupon.usageLimit;
    const userLimit = coupon.perUserLimit;
    if ((globalLimit != null && (!Number.isSafeInteger(globalLimit) ||
       coupon.timesUsed + Object.keys(active).length >= globalLimit)) ||
        (userLimit != null && (!Number.isSafeInteger(userLimit) ||
       userCount + Object.values(active).filter(h => h.userId === userId).length >= userLimit))) {
      throw new Error('Coupon redemption capacity exhausted');
    }
    const expiresAt = new Date(nowMs + COUPON_HOLD_MS).toISOString();
    await this.store.commit([
      { collection: COUPON_COLLECTION, id: code, updateTime: couponRef.updateTime,
        data: { ...coupon, activeReservations: {
          ...active, [orderId]: { userId, discount, expiresAt },
        } } },
      { collection: COUPON_RESERVATION_COLLECTION, id: orderId,
        data: { orderId, userId, code, discount, expiresAt, status: 'reserved',
          createdAt: new Date(nowMs).toISOString() } },
    ]);
    return { expiresAt };
  }

  /** Release an abandoned gateway checkout; never decrement redeemed usage. */
  async releaseCouponReservation(orderId: string, code: string): Promise<void> {
    validId(orderId);
    const couponCode = code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{1,64}$/.test(couponCode)) throw new Error('Invalid coupon');
    const reservationRef = await this.store.collection(COUPON_RESERVATION_COLLECTION).doc(orderId).get();
    if (!reservationRef.exists) return;
    const reservation = reservationRef.data();
    if (!reservation) throw new Error('Corrupt reservation record');
    if (reservation.code !== couponCode) throw new Error('Coupon reservation ownership mismatch');
    if (reservation.status === 'released') return;
    if (reservation.status !== 'reserved' || !reservationRef.updateTime) {
      throw new Error('Cannot release a settled or invalid coupon reservation');
    }
    const couponRef = await this.store.collection(COUPON_COLLECTION).doc(couponCode).get();
    if (!couponRef.exists || !couponRef.updateTime) throw new Error('Coupon was removed before release');
    const coupon = couponRef.data();
    if (!coupon) throw new Error('Coupon record missing');
    if (coupon.activeReservations?.[orderId]?.userId !== reservation.userId) {
      throw new Error('Coupon hold no longer matches the reservation');
    }
    const active = { ...coupon.activeReservations };
    delete active[orderId];
    await this.store.commit([
      { collection: COUPON_COLLECTION, id: couponCode, updateTime: couponRef.updateTime,
        data: { ...coupon, activeReservations: active } },
      { collection: COUPON_RESERVATION_COLLECTION, id: orderId,
        updateTime: reservationRef.updateTime,
        data: { ...reservation, status: 'released', releasedAt: new Date().toISOString() } },
    ]);
  }

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
    const cursorId = validId(order.userId);
    const cursorRef = await this.store.collection(RENEWAL_CURSOR_COLLECTION).doc(cursorId).get();
    const cursor = cursorRef.exists ? cursorRef.data() : undefined;
    if (!cursor || !cursorRef.updateTime || cursor.userId !== order.userId || cursor.lastOrderId !== orderId ||
        typeof cursor.previousExpiresAt !== 'string' || !Number.isFinite(Date.parse(cursor.previousExpiresAt))) {
      throw new Error('Refund requires manual reconciliation: renewal cursor is missing or newer purchases exist');
    }
    await this.store.commit([
      { collection: RENEWAL_CURSOR_COLLECTION, id: cursorId, updateTime: cursorRef.updateTime,
        data: { ...cursor, expiresAt: cursor.previousExpiresAt, lastOrderId: cursor.previousOrderId || null,
          previousExpiresAt: cursor.previousExpiresAt, updatedAt: refundedAt } },
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

  /** List a student's persisted orders, scoped by verified Firebase UID. */
  async getStudentOrders(userId: string): Promise<StoredOrder[]> {
    if (!userId?.trim()) throw new Error('Student identifier is required');
    const records = await this.store.queryEqual(ORDER_COLLECTION, 'userId', userId);
    return records.map(item => item.data as StoredOrder)
      .filter(order => order.userId === userId && typeof order.orderId === 'string')
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  /** Administrative ledger; never expose this method to student-scoped routes. */
  async getAllOrders(): Promise<StoredOrder[]> {
    const records = await this.store.list(ORDER_COLLECTION);
    return records.map(item => item.data as StoredOrder)
      .filter(order => typeof order.orderId === 'string')
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
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

    // The accepted order is the authority for its coupon and discount. Count
    // redemption in the SAME atomic commit as the paid order and entitlement.
    // Firestore's updateTime precondition on the coupon document serializes
    // global and per-student limits across concurrent workers and CMS edits.
    const couponWrites: {
      collection: string; id: string; data?: Record<string, any>; updateTime?: string;
    }[] = [];
    if (order.coupon) {
      const code = order.coupon.trim().toUpperCase();
      if (!/^[A-Z0-9_-]{1,64}$/.test(code) || !Number.isFinite(order.discount) ||
          order.discount <= 0 || order.discount > order.grossAmount) {
        throw new Error('Discounted order has an invalid coupon or amount; manual reconciliation required');
      }
      const couponRef = await this.store.collection(COUPON_COLLECTION).doc(code).get();
      if (!couponRef.exists || !couponRef.updateTime) {
        throw new Error('Paid coupon was removed or has no revision; manual reconciliation required');
      }
      const coupon = couponRef.data();
      if (!coupon || coupon.code !== code || !Number.isSafeInteger(coupon.timesUsed) ||
          coupon.timesUsed < 0 || !coupon.userUsageMap ||
          typeof coupon.userUsageMap !== 'object' || Array.isArray(coupon.userUsageMap)) {
        throw new Error('Paid coupon record is invalid; manual reconciliation required');
      }
      // A paid discounted order must possess its own pre-gateway reservation.
      // Retries or stale reservations are never silently counted as new sales.
      if (order.couponReservationId !== orderId ||
          !order.couponReservationExpiresAt ||
          !Number.isFinite(Date.parse(order.couponReservationExpiresAt))) {
        throw new Error('Paid discounted order lacks a valid pre-charge reservation; manual reconciliation required');
      }
      const hold = coupon.activeReservations?.[orderId];
      if (!hold || hold.userId !== order.userId ||
          hold.discount !== order.discount ||
          hold.expiresAt !== order.couponReservationExpiresAt) {
        throw new Error('Paid coupon hold does not match order; manual reconciliation required');
      }
      const reservationRef = await this.store.collection(COUPON_RESERVATION_COLLECTION).doc(orderId).get();
      const reservation = reservationRef.data();
      if (!reservationRef.exists || !reservationRef.updateTime ||
          reservation?.status !== 'reserved' || reservation?.userId !== order.userId ||
          reservation?.code !== code || reservation?.discount !== order.discount ||
          reservation?.expiresAt !== hold.expiresAt) {
        throw new Error('Paid coupon reservation is missing or changed; manual reconciliation required');
      }
      // A delayed, verified gateway event is allowed even after the timer:
      // unresolved provider orders keep their original capacity reserved.
      // A reclaimed/released hold has already failed the membership and
      // reservation-status checks above, so capacity cannot be double-spent.
      const previousCount = coupon.userUsageMap[order.userId] ?? 0;
      if (!Number.isSafeInteger(previousCount) || previousCount < 0) {
        throw new Error('Paid coupon student usage is corrupt; manual reconciliation required');
      }
      const globalLimit = coupon.usageLimit;
      const studentLimit = coupon.perUserLimit;
      if ((globalLimit != null && (!Number.isSafeInteger(globalLimit) || globalLimit <= coupon.timesUsed)) ||
          (studentLimit != null && (!Number.isSafeInteger(studentLimit) || studentLimit <= previousCount))) {
        // The gateway may already have collected funds. Never acknowledge
        // or grant the pass until a human reconciles this paid conflict.
        throw new Error('Coupon redemption limit changed after checkout; manual payment reconciliation required');
      }
      const redemption = await this.store.collection(COUPON_REDEMPTION_COLLECTION).doc(validId(orderId)).get();
      if (redemption.exists) throw new Error('Coupon was previously redeemed by this order; manual reconciliation required');
      const remainingHolds = { ...coupon.activeReservations };
      delete remainingHolds[orderId];
      couponWrites.push(
        { collection: COUPON_COLLECTION, id: code, updateTime: couponRef.updateTime,
          data: { ...coupon, timesUsed: coupon.timesUsed + 1,
            activeReservations: remainingHolds,
            userUsageMap: { ...coupon.userUsageMap, [order.userId]: previousCount + 1 },
            updatedAt: paidAt } },
        { collection: COUPON_REDEMPTION_COLLECTION, id: validId(orderId),
          data: { orderId, userId: order.userId, code, discount: order.discount,
            provider, providerPaymentId, redeemedAt: paidAt } },
        { collection: COUPON_RESERVATION_COLLECTION, id: validId(orderId),
          updateTime: reservationRef.updateTime,
          data: { ...reservation, status: 'redeemed', providerPaymentId, redeemedAt: paidAt } },
      );
    } else if (order.discount > 0) {
      throw new Error('Paid order contains an unexplained discount; manual reconciliation required');
    }

    await this.store.commit([
      { collection: ORDER_COLLECTION, id: validId(orderId),
        data: { ...order, status: 'paid', paidAt, providerPaymentId }, updateTime: orderRef.updateTime },
      { collection: EVENT_COLLECTION, id: eventKey,
        data: { provider, eventId, orderId, providerOrderId, providerPaymentId, processedAt: paidAt } },
      { collection: ENTITLEMENT_COLLECTION, id: entitlementId, data: finalEntitlement },
      { collection: RENEWAL_CURSOR_COLLECTION, id: cursorId,
        ...(cursorRef.updateTime ? { updateTime: cursorRef.updateTime } : {}),
        data: { userId: order.userId, expiresAt, lastOrderId: orderId,
          previousOrderId: cursor?.lastOrderId || null,
          previousExpiresAt: new Date(baseMs).toISOString(), updatedAt: paidAt } },
      { collection: PAYMENT_CLAIM_COLLECTION, id: paymentClaimId,
        data: { provider, providerPaymentId, orderId, createdAt: paidAt } },
      ...couponWrites,
    ]);
    return 'settled';
  }
}
