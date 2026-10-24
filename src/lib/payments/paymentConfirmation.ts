import type { FirestoreDocumentStore } from '../firebase/documentStore';
export interface PaymentConfirmation {
  orderId: string; status: string; settled: boolean;
}
/** Read-only projection. Browser callbacks can neither settle orders nor grant passes. */
export async function readOwnedPaymentConfirmation(db: FirestoreDocumentStore, uid: string, orderId: string): Promise<PaymentConfirmation | null> {
  if (!uid || !/^[A-Za-z0-9_-]{1,200}$/.test(orderId)) return null;
  const ref = await db.collection('paymentOrders').doc(orderId).get();
  const order = ref.data();
  if (!order || order.orderId !== orderId || order.userId !== uid) return null;
  const pass = order.status === 'paid'
    ? (await db.collection('paymentEntitlements').doc('payment-' + orderId).get()).data() : null;
  return { orderId, status: order.status, settled: order.status === 'paid' && pass?.status === 'active' &&
    pass?.userId === uid && pass?.orderId === orderId && Boolean(order.providerPaymentId) &&
    pass?.paymentId === order.providerPaymentId };
}
const cancelled = () => new Error('Payment confirmation cancelled');
const pause = (signal: AbortSignal) => new Promise<void>((resolve, reject) => {
  if (signal.aborted) return reject(cancelled());
  const abort = () => { clearTimeout(timer); reject(cancelled()); };
  const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, 1500);
  signal.addEventListener('abort', abort, { once: true });
});
export async function waitForPaymentConfirmation(orderId: string, read: () => Promise<PaymentConfirmation>,
  signal: AbortSignal, wait = pause): Promise<PaymentConfirmation> {
  for (let attempt = 0; attempt < 20; attempt++) {
    if (signal.aborted) throw cancelled();
    const result = await read();
    if (signal.aborted) throw cancelled();
    if (result.orderId !== orderId || !['created', 'pending', 'paid', 'failed', 'cancelled', 'refunded'].includes(result.status)) {
      throw new Error('Payment confirmation returned an invalid order. Check your purchase history.');
    }
    if (result.status === 'paid' && result.settled === true) return result;
    if (['failed', 'cancelled', 'refunded'].includes(result.status)) {
      throw new Error('This order is ' + result.status + '. Check your purchase history before making another payment.');
    }
    if (attempt < 19) await wait(signal);
  }
  throw new Error('Payment confirmation is still pending. Do not pay again. Check your purchase history or check this order again shortly.');
}
