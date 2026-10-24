import assert from 'node:assert/strict';
import test from 'node:test';
import { RazorpayAdapter } from '../src/lib/payments/adapters/razorpayAdapter';
import type { StoredOrder } from '../src/lib/payments/types';
const order: StoredOrder = { orderId: 'ord-qa', userId: 'student', items: [], grossAmount: 100,
  discount: 10, tax: 18, currency: 'INR', provider: 'razorpay', providerOrderId: '', status: 'created', createdAt: new Date().toISOString() };
const valid = { id: 'order_gateway123', entity: 'order', amount: 10800, currency: 'INR', receipt: 'ord-qa',
  status: 'created', amount_paid: 0, amount_due: 10800 };
const adapter = () => new RazorpayAdapter({ keyId: 'rzp_test_configured123', secretKey: 'configured-secret', testMode: true });
test('production runtime uses the real API with sandbox keys and the full tax-inclusive amount', async () => {
  const oldEnv = process.env.APP_ENV; const oldNode = process.env.NODE_ENV; const original = globalThis.fetch;
  process.env.APP_ENV = 'staging'; process.env.NODE_ENV = 'production'; let calls = 0;
  try {
    globalThis.fetch = async (url, options) => {
      calls++; assert.equal(url, 'https://api.razorpay.com/v1/orders');
      const payload = JSON.parse(String(options?.body));
      assert.equal(payload.amount, 10800); assert.equal(payload.receipt, order.orderId);
      return Response.json(valid);
    };
    assert.equal((await adapter().createOrder(order)).providerOrderId, valid.id); assert.equal(calls, 1);
  } finally { globalThis.fetch = original; if (oldEnv === undefined) delete process.env.APP_ENV; else process.env.APP_ENV = oldEnv;
    if (oldNode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = oldNode; }
});
test('provider failure, timeout or mismatched response cannot become a simulated successful order', async () => {
  const original = globalThis.fetch;
  try {
    for (const result of [new Response('unavailable', { status: 503 }), Response.json({ ...valid, amount: 100 }),
      Response.json({ ...valid, receipt: 'another-order' }), Response.json({ ...valid, currency: 'USD' }),
      Response.json({ ...valid, amount_paid: 100 }), Response.json({ ...valid, id: 'fake' })]) {
      globalThis.fetch = async () => result;
      await assert.rejects(adapter().createOrder(order));
    }
    globalThis.fetch = async () => { throw new Error('timeout'); };
    await assert.rejects(adapter().createOrder(order), /timeout/);
  } finally { globalThis.fetch = original; }
});
test('staging rejects live checkout and live refund credentials before making network requests', async () => {
  const previous = process.env.APP_ENV; const original = globalThis.fetch; process.env.APP_ENV = 'staging'; let calls = 0;
  try {
    globalThis.fetch = async () => { calls++; return Response.json(valid); };
    const live = new RazorpayAdapter({ keyId: 'rzp_live_configured123', secretKey: 'configured-secret',
      webhookSecret: 'configured-webhook', testMode: false });
    await assert.rejects(live.createOrder(order), /staging requires test keys/);
    assert.throws(() => live.assertRefundConfigured(), /Real gateway/);
    assert.equal(calls, 0);
  } finally { globalThis.fetch = original; if (previous === undefined) delete process.env.APP_ENV; else process.env.APP_ENV = previous; }
});
