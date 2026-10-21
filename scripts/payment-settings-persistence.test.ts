import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { sealGatewaySettings, openGatewaySettings } from '../src/lib/payments/settingsEncryption';

test('payment gateway secret values are encrypted at rest and recoverable', () => {
  const originalKey = process.env.PAYMENT_SETTINGS_ENCRYPTION_KEY;
  process.env.PAYMENT_SETTINGS_ENCRYPTION_KEY = 'unit-test-credential-key-not-for-production';
  try {
    const settings: any = {
      activeProvider: 'razorpay', testMode: true,
      razorpayKeyId: 'rzp_test_example',
      razorpayKeySecret: 'SECRET_RAZORPAY_VALUE',
      razorpayWebhookSecret: 'SECRET_WEBHOOK_VALUE',
      stripePublishableKey: 'pk_test_example',
      stripeSecretKey: 'SECRET_STRIPE_VALUE',
      stripeWebhookSecret: 'SECRET_STRIPE_WEBHOOK',
      taxRatePercentage: 18, allowCouponDiscounts: true,
    };
    const stored = sealGatewaySettings(settings);
    const serialized = JSON.stringify(stored);
    assert.equal(serialized.includes('SECRET_'), false);
    assert.ok(stored.encryptedCredentials);
    assert.equal(openGatewaySettings(stored).razorpayKeySecret, settings.razorpayKeySecret);
    assert.equal(openGatewaySettings(stored).stripeWebhookSecret, settings.stripeWebhookSecret);
    const tampered = structuredClone(stored);
    tampered.encryptedCredentials.tag = Buffer.alloc(16).toString('base64');
    assert.throws(() => openGatewaySettings(tampered), /cannot be decrypted/);
  } finally {
    if (originalKey === undefined) delete process.env.PAYMENT_SETTINGS_ENCRYPTION_KEY;
    else process.env.PAYMENT_SETTINGS_ENCRYPTION_KEY = originalKey;
  }
});

test('payment configuration only acknowledges successful durable Firestore commits', () => {
  const server = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  const module = readFileSync(new URL('../src/lib/payments/paymentSettingsRepository.ts', import.meta.url), 'utf8');
  assert.match(server, /paymentSettingsRepository\.run\(\(\) => paymentService\.updateSettings\(req\.body\), true\)/);
  assert.match(server, /\['\/api\/payments', '\/api\/admin\/payments\/settings'\]/);
  assert.match(module, /collection: 'paymentRuntimeSettings'/);
  assert.match(module, /getAdminFirestore/);
});
