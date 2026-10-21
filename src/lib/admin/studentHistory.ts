import type { FirestoreDocumentStore } from '../firebase/documentStore';
/** Administrator-only projections use exact Firebase ownership, never matching email or browser input. */
export async function readStudentOrders(db: FirestoreDocumentStore | null, uid: string) {
  if (!db) throw new Error('Student order storage is unavailable.');
  return (await db.queryEqual('paymentOrders', 'userId', uid)).filter(doc => doc.data.userId === uid).map(({ data: order }) => ({
    id: order.orderId, orderId: order.orderId, orderNumber: order.providerOrderId || order.orderId,
    customerEmail: order.customerDetails?.email || '', planName: (order.items || []).map((item: any) => item.title).filter(Boolean).join(', ') || 'Resource purchase',
    amount: Number(order.grossAmount) - Number(order.discount || 0) + Number(order.tax || 0), currency: order.currency,
    gateway: order.provider, status: order.status, createdAt: order.createdAt, paymentId: order.providerPaymentId || '',
    refundRequestStatus: order.metadata?.refundRequestStatus,
  })).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}
export async function readStudentActivity(db: FirestoreDocumentStore | null, uid: string, now = Date.now()) {
  if (!db) throw new Error('Student activity storage is unavailable.');
  const cutoff = now - 30 * 86400000;
  return (await db.queryEqual('activityLogs', 'userId', uid)).filter(doc => doc.data.userId === uid && !doc.id.startsWith('act-sample-') && Date.parse(doc.data.createdAt) >= cutoff && Date.parse(doc.data.createdAt) <= now)
    .map(doc => ({ id: doc.id, type: String(doc.data.eventType || 'other'), title: String(doc.data.title || 'Reported activity'), description: 'Client-reported activity; purchases and access are verified separately.', timestamp: doc.data.createdAt }))
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp))).slice(0, 50);
}
