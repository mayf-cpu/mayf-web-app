import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { RazorpayAdapter } from '../src/lib/payments/adapters/razorpayAdapter';
import { StripeAdapter } from '../src/lib/payments/adapters/stripeAdapter';
import type { StoredOrder } from '../src/lib/payments/types';

const order = { orderId: 'qa-order', userId: 'qa-student', grossAmount: 999, discount: 0, tax: 179.82, currency: 'INR', customerDetails: {} } as StoredOrder;
test('genuine Razorpay test keys create a real provider order rather than a fabricated ID', async t => {
  let called = false;
  t.mock.method(globalThis, 'fetch', async (url: any, init: any) => {
    called = true; assert.equal(String(url), 'https://api.razorpay.com/v1/orders');
    assert.equal(JSON.parse(init.body).amount, 117882);
    return Response.json({ id: 'order_from_gateway' });
  });
  const result = await new RazorpayAdapter({ keyId: 'rzp_test_fixture', secretKey: 'fixture-secret', testMode: true }).createOrder(order);
  assert.equal(called, true); assert.equal(result.providerOrderId, 'order_from_gateway');
});
test('configured gateway rejection cannot fall back to a simulated checkout', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 401 }));
  await assert.rejects(new RazorpayAdapter({ keyId: 'rzp_test_fixture', secretKey: 'fixture-secret' }).createOrder(order), /could not create/);
  await assert.rejects(new StripeAdapter({ keyId: 'pk_test_fixture', secretKey: 'sk_test_fixture' }).createOrder(order), /could not create/);
});
test('Stripe test checkout includes return destinations and exposes only the genuine checkout URL', async t => {
  t.mock.method(globalThis, 'fetch', async (url: any, init: any) => {
    const params = new URLSearchParams(init.body);
    assert.match(params.get('success_url')!, /orderId=qa-order.*stripeSessionId=/);
    assert.match(params.get('cancel_url')!, /cancelled=1/);
    assert.equal(params.get('client_reference_id'), order.orderId);
    return Response.json({ id: 'cs_test_fixture', url: 'https://checkout.stripe.com/c/pay/cs_test_fixture' });
  });
  const result = await new StripeAdapter({ keyId: 'pk_test_fixture', secretKey: 'sk_test_fixture', testMode: true }).createOrder(order);
  assert.equal(result.clientPayload?.checkoutUrl, 'https://checkout.stripe.com/c/pay/cs_test_fixture');
});
test('Razorpay callback requires captured funds and returns the provider amount for order matching', async t => {
  let status = 'authorized';
  t.mock.method(globalThis, 'fetch', async () => Response.json({ id: 'pay_qa', order_id: 'order_qa', status, amount: 117882, currency: 'INR' }));
  const adapter = new RazorpayAdapter({ keyId: 'rzp_test_fixture', secretKey: 'fixture-secret', testMode: false });
  const request = { orderId: 'qa-order', provider: 'razorpay' as const, providerOrderId: 'order_qa', providerPaymentId: 'pay_qa', signature: crypto.createHmac('sha256', 'fixture-secret').update('order_qa|pay_qa').digest('hex') };
  assert.equal((await adapter.verifyPaymentSignature(request)).valid, false);
  status = 'captured';
  const result = await adapter.verifyPaymentSignature(request);
  assert.equal(result.valid, true); assert.equal(result.rawAmount, 1178.82);
});
