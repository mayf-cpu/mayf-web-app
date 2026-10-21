import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DurablePaymentRepository } from '../src/lib/payments/durablePaymentRepository';
import type { FirestoreDocumentStore } from '../src/lib/firebase/documentStore';
import { initiateFullRefund, type RefundIntent } from '../src/lib/payments/refundInitiation';
import { RazorpayAdapter } from '../src/lib/payments/adapters/razorpayAdapter';
function fixture() {
  const docs = new Map<string, { data: any; revision: number }>();
  // Seeded fixtures may start at revision 1; fresh commits must advance past it.
  let revision = 1;
  const store = {
    collection: (collection: string) => ({ doc: (id: string) => ({
      get: async () => {
        const record = docs.get(collection + '/' + id);
        return { exists: Boolean(record), data: () => structuredClone(record?.data),
          updateTime: record ? String(record.revision) : undefined };
      },
    }) }),
    commit: async (writes: { collection: string; id: string; data?: Record<string, any>; updateTime?: string }[]) => {
      for (const write of writes) {
        const current = docs.get(write.collection + '/' + write.id);
        if (write.updateTime ? String(current?.revision) !== write.updateTime : Boolean(current))
          throw new Error('Concurrent payment update');
      }
      for (const write of writes) {
        const key = write.collection + '/' + write.id;
        if (write.data === undefined) docs.delete(key);
        else docs.set(key, { data: structuredClone(write.data), revision: ++revision });
      }
    },
  };
  return { repo: new DurablePaymentRepository(store as unknown as FirestoreDocumentStore), db: store as unknown as FirestoreDocumentStore, docs };
}
function paidFixture() {
  const f = fixture();
  const seed = (key: string, data: any) => f.docs.set(key, { data, revision: 1 });
  seed('paymentOrders/ord-1', { orderId: 'ord-1', userId: 'student', provider: 'razorpay',
    providerPaymentId: 'pay_123', providerOrderId: 'order_123', grossAmount: 100,
    discount: 10, tax: 18, currency: 'INR', status: 'paid', items: [] });
  seed('paymentEntitlements/payment-ord-1', { userId: 'student', orderId: 'ord-1', paymentId: 'pay_123', status: 'active' });
  seed('paymentRenewalCursors/student', { userId: 'student', lastOrderId: 'ord-1', previousExpiresAt: '2026-10-20T00:00:00Z' });
  return f;
}
const request = { orderId: 'ord-1', amount: 108, actorUid: 'admin', reason: 'Customer request' };
test('refund initiation persists before send, retains paid access and prevents duplicate sends after restart', async () => {
  const { db, docs } = paidFixture(); let sends = 0;
  const send = async (intent: RefundIntent) => {
    sends++; assert.equal(docs.get('paymentRefundRequests/ord-1')?.data.status, 'requested');
    assert.equal(intent.amount, 10800); assert.equal(intent.actorUid, 'admin');
    return { refundId: 'rfnd_123' };
  };
  assert.equal((await initiateFullRefund(db, request, send)).status, 'awaiting_webhook');
  assert.equal((await initiateFullRefund(db, request, send)).status, 'awaiting_webhook');
  assert.equal(sends, 1);
  assert.equal(docs.get('paymentOrders/ord-1')?.data.status, 'paid');
  assert.equal(docs.get('paymentEntitlements/payment-ord-1')?.data.status, 'active');
});
test('unknown gateway outcome records review and never sends automatically again', async () => {
  const { db, docs } = paidFixture(); let sends = 0;
  const send = async () => { sends++; throw new Error('timeout after provider accepted'); };
  assert.equal((await initiateFullRefund(db, request, send)).status, 'needs_review');
  await initiateFullRefund(db, request, send);
  assert.equal(sends, 1); assert.equal(docs.get('paymentOrders/ord-1')?.data.status, 'paid');
});
test('partial amount, unpaid, unsupported provider and older renewal fail before provider calls', async () => {
  for (const change of ['amount', 'status', 'provider', 'cursor']) {
    const { db, docs } = paidFixture(); let sends = 0;
    if (change === 'status') docs.get('paymentOrders/ord-1')!.data.status = 'pending';
    if (change === 'provider') docs.get('paymentOrders/ord-1')!.data.provider = 'stripe';
    if (change === 'cursor') docs.get('paymentRenewalCursors/student')!.data.lastOrderId = 'newer-order';
    await assert.rejects(initiateFullRefund(db, { ...request, amount: change === 'amount' ? 90 : 108 }, async () => {
      sends++; return { refundId: 'rfnd_123' };
    }));
    assert.equal(sends, 0); assert.equal(docs.has('paymentRefundRequests/ord-1'), false);
  }
});
test('concurrent refund requests have one durable winner and one provider send', async () => {
  const { db } = paidFixture(); let sends = 0;
  const results = await Promise.allSettled([1, 2].map(() => initiateFullRefund(db, request, async () => {
    sends++; return { refundId: 'rfnd_123' };
  })));
  assert.equal(sends, 1); assert.ok(results.some(r => r.status === 'fulfilled'));
});
test('failed durable preparation cannot initiate a provider refund', async () => {
  const { db } = paidFixture(); db.commit = async () => { throw new Error('storage unavailable'); };
  let sends = 0;
  await assert.rejects(initiateFullRefund(db, request, async () => { sends++; return { refundId: 'rfnd_123' }; }));
  assert.equal(sends, 0);
});
test('failure to save provider acknowledgement leaves an auditable intent and prevents resend', async () => {
  const { db, docs } = paidFixture(); const commit = db.commit.bind(db); let commits = 0; let sends = 0;
  db.commit = async writes => { if (++commits === 2) throw new Error('storage unavailable'); return commit(writes); };
  const send = async () => { sends++; return { refundId: 'rfnd_123' }; };
  await assert.rejects(initiateFullRefund(db, request, send), /storage unavailable/);
  assert.equal(docs.get('paymentRefundRequests/ord-1')?.data.status, 'requested');
  await initiateFullRefund(db, request, send); assert.equal(sends, 1);
});
test('a verified refund with another ID cannot complete an acknowledged request', async () => {
  const { db, docs, repo } = paidFixture();
  await initiateFullRefund(db, request, async () => ({ refundId: 'rfnd_123' }));
  await assert.rejects(repo.recordVerifiedFullRefund({ orderId: 'ord-1', provider: 'razorpay',
    providerOrderId: 'order_123', providerPaymentId: 'pay_123', refundId: 'rfnd_other', eventId: 'event-123',
    refundAmount: 108, currency: 'INR', refundedAt: new Date().toISOString() }), /conflicts with the saved/);
  assert.equal(docs.get('paymentOrders/ord-1')?.data.status, 'paid');
});
test('verified webhook before API reply completes request without later downgrade', async () => {
  const { db, repo, docs } = paidFixture();
  const result = await initiateFullRefund(db, request, async () => {
    await repo.recordVerifiedFullRefund({ orderId: 'ord-1', provider: 'razorpay', providerOrderId: 'order_123',
      providerPaymentId: 'pay_123', refundId: 'rfnd_123', eventId: 'event-123', refundAmount: 108,
      currency: 'INR', refundedAt: '2026-10-21T00:00:00Z' });
    return { refundId: 'rfnd_123' };
  });
  assert.equal(result.status, 'completed');
  assert.equal(docs.get('paymentOrders/ord-1')?.data.status, 'refunded');
  assert.equal(docs.get('paymentEntitlements/payment-ord-1')?.data.status, 'revoked');
});
test('provider refund API uses saved key, exact subunits and validates response without fake success', async () => {
  const adapter = new RazorpayAdapter({ keyId: 'rzp_test_actual123', secretKey: 'configured-secret',
    webhookSecret: 'configured-webhook', testMode: true });
  const original = globalThis.fetch; let calls = 0;
  const intent: RefundIntent = { ...request, amount: 10800, providerPaymentId: 'pay_123', currency: 'INR',
    idempotencyKey: 'saved-idempotency-key', requestedAt: new Date().toISOString(), status: 'requested' };
  try {
    globalThis.fetch = async (url, options) => {
      calls++; assert.equal(url, 'https://api.razorpay.com/v1/payments/pay_123/refund');
      assert.equal((options?.headers as Record<string, string>)['X-Refund-Idempotency'], intent.idempotencyKey);
      assert.deepEqual(JSON.parse(String(options?.body)), { amount: 10800, speed: 'normal' });
      return Response.json({ id: 'rfnd_123', entity: 'refund', payment_id: 'pay_123',
        amount: calls === 1 ? 10800 : 100, currency: 'INR', status: 'processed' });
    };
    assert.deepEqual(await adapter.initiateFullRefund(intent), { refundId: 'rfnd_123' });
    await assert.rejects(adapter.initiateFullRefund(intent), /unconfirmed/);
    assert.throws(() => new RazorpayAdapter({ keyId: 'rzp_test_demo123', secretKey: 'sandbox',
      webhookSecret: 'secret' }).assertRefundConfigured(), /Real gateway/);
  } finally { globalThis.fetch = original; }
});
