import assert from 'node:assert/strict';
import { test } from 'node:test';
import crypto from 'node:crypto';
import { PaymentService } from '../src/lib/payments/paymentService';
import { RazorpayAdapter } from '../src/lib/payments/adapters/razorpayAdapter';
import { StripeAdapter } from '../src/lib/payments/adapters/stripeAdapter';
import type { StoredOrder, VerifyPaymentRequest } from '../src/lib/payments/types';

const secret = 'regression-only-secret';
const sign = (body: string) => crypto.createHmac('sha256', secret).update(body).digest('hex');

function fixture(provider: 'razorpay' | 'stripe' = 'razorpay') {
  const service = new PaymentService();
  service.updateSettings({ testMode: false, razorpayKeySecret: secret, razorpayWebhookSecret: secret, stripeWebhookSecret: secret });
  const order = service.getAllOrders().find((o) => o.provider === provider)!;
  order.status = 'created';
  order.paidAt = null;
  order.providerPaymentId = undefined;
  return { service, order };
}

function callback(order: StoredOrder): VerifyPaymentRequest {
  return {
    orderId: order.orderId, userId: order.userId, provider: order.provider,
    providerOrderId: order.providerOrderId, providerPaymentId: 'pay_verified',
    signature: sign(`${order.providerOrderId}|pay_verified`),
  };
}

function razorpayEvent(order: StoredOrder, overrides: Record<string, unknown> = {}) {
  const body = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: {
    id: 'pay_verified', order_id: order.providerOrderId,
    amount: Math.round((order.grossAmount - order.discount + (order.tax || 0)) * 100),
    currency: order.currency, ...overrides,
  } } } });
  return { body, headers: { 'x-razorpay-signature': sign(body), 'x-razorpay-event-id': 'evt_test' } };
}

test('valid signed Razorpay callback retains payment flow', async () => {
  const { service, order } = fixture();
  assert.equal((await service.verifyPaymentSignature(callback(order))).success, true);
  assert.equal(order.status, 'paid');
});

test('callback rejects missing or different owners, provider changes, and unrelated orders', async () => {
  for (const change of [{ userId: undefined }, { userId: 'other-user' }, { provider: 'stripe' as const }, { providerOrderId: '' }, { providerOrderId: 'other-order' }]) {
    const { service, order } = fixture();
    assert.equal((await service.verifyPaymentSignature({ ...callback(order), ...change })).success, false);
    assert.equal(order.status, 'created');
  }
});

test('Stripe session alias cannot override the stored order', async () => {
  const { service, order } = fixture('stripe');
  assert.equal((await service.verifyPaymentSignature({ ...callback(order), stripeSessionId: 'cs_other_paid_order' })).success, false);
  assert.equal(order.status, 'created');
});

test('valid Stripe callback is verified against the stored session', async (t) => {
  const { service, order } = fixture('stripe');
  t.mock.method(StripeAdapter.prototype, 'verifyPaymentSignature', async (request: VerifyPaymentRequest) => {
    assert.equal(request.providerOrderId, order.providerOrderId);
    assert.equal(request.stripeSessionId, order.providerOrderId);
    return { valid: true, providerPaymentId: 'pi_verified' };
  });
  assert.equal((await service.verifyPaymentSignature(callback(order))).success, true);
});

test('Razorpay event header deduplicates deliveries and paid orders survive late failures', async () => {
  const { service, order } = fixture();
  const event = razorpayEvent(order);
  assert.equal((await service.handleWebhook('razorpay', event.headers, event.body)).status, 'processed');
  assert.equal((await service.handleWebhook('razorpay', event.headers, event.body)).status, 'duplicate_ignored');
  const failed = event.body.replace('payment.captured', 'payment.failed');
  await service.handleWebhook('razorpay', { 'x-razorpay-signature': sign(failed), 'x-razorpay-event-id': 'evt_failure' }, failed);
  assert.equal(order.status, 'paid');
});

test('Razorpay retries without event header use a stable payload identity', async () => {
  const adapter = new RazorpayAdapter({ webhookSecret: secret });
  const { order } = fixture();
  const { body } = razorpayEvent(order);
  const headers = { 'x-razorpay-signature': sign(body) };
  assert.equal((await adapter.verifyWebhook(headers, body)).eventId, (await adapter.verifyWebhook(headers, body)).eventId);
});

test('signed webhooks with wrong amount or currency do not mark the order paid', async () => {
  for (const override of [{ amount: 1 }, { currency: 'USD' }, { amount: null }]) {
    const { service, order } = fixture();
    const { headers, body } = razorpayEvent(order, override);
    assert.equal((await service.handleWebhook('razorpay', headers, body)).success, false);
    assert.equal(order.status, 'created');
  }
});

test('unknown orders remain retryable and are not consumed as processed events', async () => {
  const { service, order } = fixture();
  const event = razorpayEvent(order, { order_id: 'order_not_yet_stored' });
  assert.equal((await service.handleWebhook('razorpay', event.headers, event.body)).status, 'failed');
  order.providerOrderId = 'order_not_yet_stored';
  assert.equal((await service.handleWebhook('razorpay', event.headers, event.body)).status, 'processed');
});

function stripeEvent(type: string, object: Record<string, unknown>, timestamp = Math.floor(Date.now() / 1000)) {
  const body = JSON.stringify({ id: 'evt_stripe_test', type, data: { object } });
  return { body, headers: { 'stripe-signature': `t=${timestamp},v1=${sign(`${timestamp}.${body}`)}` } };
}

test('Stripe completed but unpaid sessions stay pending; delayed success can be paid', async () => {
  const adapter = new StripeAdapter({ webhookSecret: secret });
  for (const [type, payment_status, expected] of [
    ['checkout.session.completed', 'unpaid', 'pending'],
    ['checkout.session.completed', 'paid', 'paid'],
    ['checkout.session.async_payment_succeeded', 'paid', 'paid'],
  ]) {
    const event = stripeEvent(type, { id: 'cs_test', payment_status, amount_total: 2900, currency: 'usd' });
    assert.equal((await adapter.verifyWebhook(event.headers, event.body)).status, expected);
  }
});

test('Stripe rejects stale, future and malformed signatures without throwing', async () => {
  const adapter = new StripeAdapter({ webhookSecret: secret });
  for (const offset of [-600, 600]) {
    const event = stripeEvent('checkout.session.completed', {}, Math.floor(Date.now() / 1000) + offset);
    assert.equal((await adapter.verifyWebhook(event.headers, event.body)).isValid, false);
  }
  assert.equal((await adapter.verifyWebhook({ 'stripe-signature': 't,v1' }, '{}')).isValid, false);
});

test('Stripe accepts any valid v1 signature during secret rotation', async () => {
  const adapter = new StripeAdapter({ webhookSecret: secret });
  const event = stripeEvent('checkout.session.completed', { payment_status: 'paid' });
  event.headers['stripe-signature'] += ',v1=invalid-rotated-signature';
  assert.equal((await adapter.verifyWebhook(event.headers, event.body)).isValid, true);
});

test('invalid HMAC does not update payment state', async () => {
  const { service, order } = fixture();
  const { body } = razorpayEvent(order);
  assert.equal((await service.handleWebhook('razorpay', { 'x-razorpay-signature': 'forged' }, body)).status, 'signature_invalid');
  assert.equal(order.status, 'created');
});

test('admin webhook simulations retain valid signed payloads for both providers', async () => {
  for (const provider of ['razorpay', 'stripe'] as const) {
    const { service, order } = fixture(provider);
    const input = { provider, orderId: order.orderId, eventType: provider === 'stripe' ? 'checkout.session.completed' : 'payment.captured', simulateDuplicate: true };
    assert.equal((await service.simulateWebhook(input)).status, 'processed');
    assert.equal((await service.simulateWebhook(input)).status, 'duplicate_ignored');
  }
});
