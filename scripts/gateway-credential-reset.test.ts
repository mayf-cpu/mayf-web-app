import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import { RazorpayAdapter } from '../src/lib/payments/adapters/razorpayAdapter';
import { StripeAdapter } from '../src/lib/payments/adapters/stripeAdapter';
import { PaymentService } from '../src/lib/payments/paymentService';

const secret = 'revoked-webhook-secret';
function signed(provider: 'razorpay' | 'stripe') {
  const body = provider === 'razorpay' ? '{"event":"payment.captured"}' : '{"id":"evt-1","type":"checkout.session.completed"}';
  const timestamp = String(Math.floor(Date.now() / 1000));
  const digest = crypto.createHmac('sha256', secret).update(provider === 'razorpay' ? body : timestamp + '.' + body).digest('hex');
  return { body, headers: provider === 'razorpay' ? { 'x-razorpay-signature': digest } : { 'stripe-signature': `t=${timestamp},v1=${digest}` } };
}
for (const provider of ['razorpay', 'stripe'] as const) {
  test(`${provider} removed configuration revokes old webhook and API credentials`, async () => {
    const adapter = provider === 'razorpay' ? new RazorpayAdapter() : new StripeAdapter();
    adapter.configure({ keyId: 'configured-key', secretKey: 'configured-api-secret', webhookSecret: secret });
    const { body, headers } = signed(provider);
    assert.equal((await adapter.verifyWebhook(headers, body)).isValid, true);
    assert.equal(adapter.hasSecret(), true);
    adapter.configure({ keyId: '' });
    assert.equal(adapter.hasSecret(), false);
    assert.equal(adapter.hasWebhookSecret(), false);
    assert.equal(adapter.getKeyId(), '');
    assert.equal((await adapter.verifyWebhook(headers, body)).isValid, false);
  });
}
test('deleted durable settings in production invalidate both previously accepted provider webhooks', async () => {
  const keys = ['APP_ENV', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET',
    'STRIPE_PUBLISHABLE_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'];
  const saved = new Map(keys.map(key => [key, process.env[key]]));
  try {
    for (const key of keys) process.env[key] = '';
    process.env.APP_ENV = 'production';
    const service = new PaymentService();
    service.updateSettings({ razorpayKeyId: 'rzp_test_configured', razorpayKeySecret: 'configured-api-secret',
      razorpayWebhookSecret: secret, stripePublishableKey: 'pk_test_configured',
      stripeSecretKey: 'sk_test_configured', stripeWebhookSecret: secret });
    for (const provider of ['razorpay', 'stripe'] as const) {
      const { body, headers } = signed(provider);
      assert.equal((await service.verifyWebhookReceipt(provider, headers, body)).isValid, true);
    }
    service.settingsState.importState([]);
    for (const provider of ['razorpay', 'stripe'] as const) {
      const { body, headers } = signed(provider);
      assert.equal((await service.verifyWebhookReceipt(provider, headers, body)).isValid, false);
    }
    assert.throws(() => service.assertRefundConfigured(), /Real gateway/);
  } finally {
    for (const [key, value] of saved) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});
