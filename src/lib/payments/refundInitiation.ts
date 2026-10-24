import crypto from 'node:crypto';
import type { FirestoreDocumentStore } from '../firebase/documentStore';
import type { StoredOrder } from './types';

export interface RefundIntent {
  orderId: string; providerPaymentId: string; amount: number; currency: 'INR';
  idempotencyKey: string; actorUid: string; reason: string; requestedAt: string;
  status: 'requested' | 'awaiting_webhook' | 'needs_review' | 'completed';
  providerRefundId?: string;
}
export type RefundSender = (intent: RefundIntent) => Promise<{ refundId: string }>;

/** Persist before contacting the gateway. A repeated administrator action NEVER sends again.
 * Unknown outcomes (including a crash before send) require operator reconciliation.
 * The immutable key/body allow a controlled recovery using Razorpay's idempotent API.
 */
export async function initiateFullRefund(db: FirestoreDocumentStore, args: {
  orderId: string; amount: number; actorUid: string; reason: string;
}, send: RefundSender): Promise<RefundIntent> {
  if (!/^[A-Za-z0-9_-]{1,200}$/.test(args.orderId) || !args.actorUid?.trim() ||
      typeof args.reason !== 'string' || !args.reason.trim() || args.reason.length > 500 ||
      !Number.isFinite(args.amount) || args.amount <= 0) throw new Error('Invalid full refund request');
  const requestRef = await db.collection('paymentRefundRequests').doc(args.orderId).get();
  if (requestRef.exists) return requestRef.data() as RefundIntent;
  const orderRef = await db.collection('paymentOrders').doc(args.orderId).get();
  const order = orderRef.data() as StoredOrder | undefined;
  if (!order || !orderRef.updateTime || order.orderId !== args.orderId || order.status !== 'paid') {
    throw new Error('Refund requires an existing paid order with a valid revision');
  }
  if (order.provider !== 'razorpay' || order.currency !== 'INR') {
    throw new Error('Only Razorpay INR refunds are supported by this workflow');
  }
  if (!/^pay_[A-Za-z0-9]+$/.test(order.providerPaymentId || '')) throw new Error('Invalid captured payment identifier');
  const amount = Math.round((order.grossAmount - order.discount + (order.tax || 0)) * 100);
  if (!Number.isSafeInteger(amount) || amount <= 0 || Math.abs(args.amount * 100 - amount) > 0.00001) {
    throw new Error('Refund must match the full recorded order total including tax');
  }
  const passRef = await db.collection('paymentEntitlements').doc('payment-' + args.orderId).get();
  const pass = passRef.data();
  const cursorRef = await db.collection('paymentRenewalCursors').doc(order.userId).get();
  const cursor = cursorRef.data();
  if (!passRef.updateTime || pass?.status !== 'active' || pass.userId !== order.userId ||
      pass.orderId !== order.orderId || pass.paymentId !== order.providerPaymentId ||
      !cursorRef.updateTime || cursor?.userId !== order.userId || cursor.lastOrderId !== order.orderId ||
      !Number.isFinite(Date.parse(cursor.previousExpiresAt))) {
    throw new Error('Refund requires manual reconciliation: entitlement or latest renewal does not match');
  }
  const intent: RefundIntent = {
    orderId: order.orderId, providerPaymentId: order.providerPaymentId!, amount, currency: 'INR',
    idempotencyKey: crypto.randomUUID(), actorUid: args.actorUid, reason: args.reason.trim(),
    requestedAt: new Date().toISOString(), status: 'requested',
  };
  // Preconditions serialize concurrent refund clicks with payment/renewal changes.
  await db.commit([
    { collection: 'paymentRefundRequests', id: order.orderId, data: intent },
    { collection: 'paymentOrders', id: order.orderId, updateTime: orderRef.updateTime,
      data: { ...order, metadata: { ...order.metadata, refundRequestStatus: 'requested' } } },
    { collection: 'paymentEntitlements', id: 'payment-' + order.orderId, updateTime: passRef.updateTime, data: pass },
    { collection: 'paymentRenewalCursors', id: order.userId, updateTime: cursorRef.updateTime, data: cursor },
  ]);
  let outcome: Partial<RefundIntent>;
  try {
    const result = await send(intent);
    outcome = { status: 'awaiting_webhook', providerRefundId: result.refundId };
  } catch {
    // A timeout or rejected/malformed response is NOT evidence that funds stayed put.
    outcome = { status: 'needs_review' };
  }
  const current = await db.collection('paymentRefundRequests').doc(order.orderId).get();
  const saved = current.data() as RefundIntent;
  if (saved.status === 'completed') return saved; // webhook can arrive before API response
  if (!current.updateTime) throw new Error('Refund request revision unavailable; reconcile with gateway');
  const currentOrder = await db.collection('paymentOrders').doc(order.orderId).get();
  const next = { ...saved, ...outcome };
  await db.commit([
    { collection: 'paymentRefundRequests', id: order.orderId, updateTime: current.updateTime, data: next },
    ...(currentOrder.data()?.status === 'paid' ? [{ collection: 'paymentOrders', id: order.orderId,
      updateTime: currentOrder.updateTime, data: { ...currentOrder.data(),
        metadata: { ...currentOrder.data()?.metadata, refundRequestStatus: next.status } } }] : []),
  ]);
  return next;
}
