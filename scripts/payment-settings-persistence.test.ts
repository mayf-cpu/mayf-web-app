import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { sealGatewaySettings, openGatewaySettings } from '../src/lib/payments/settingsEncryption';
import { PaymentService } from '../src/lib/payments/paymentService';
import { paymentSettingsStorage } from '../src/lib/payments/paymentSettingsStorage';
import { DocumentStateRepository } from '../src/lib/firebase/documentStateRepository';

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
  assert.match(module, /collection: storage.collection/);
  assert.match(module, /storage.marker/);
  assert.match(module, /getAdminFirestore/);
});

test('production never reads staging gateway credentials or its revision marker', async () => {
  const production = paymentSettingsStorage('production');
  assert.deepEqual(paymentSettingsStorage('staging'), { collection: 'paymentRuntimeSettings', marker: 'paymentSettingsState' });
  assert.deepEqual(paymentSettingsStorage('development'), paymentSettingsStorage('staging'));
  assert.notEqual(production.collection, paymentSettingsStorage('staging').collection);
  assert.notEqual(production.marker, paymentSettingsStorage('staging').marker);
  const reads: string[] = [];
  const writes: any[] = [];
  let state: any[] = [{ id: 'gateway', testMode: false, razorpayKeyId: '' }];
  const db: any = {
    collection(name: string) { reads.push(name); return { doc: () => ({ get: async () => ({ exists: false }) }) }; },
    async list(name: string) { reads.push(name); assert.equal(name, production.collection); return []; },
    async commit(changes: any[]) { writes.push(...changes); },
  };
  const repository = new DocumentStateRepository([{ collection: production.collection, state: {
    exportState: () => structuredClone(state), importState: items => { state = items; },
  } }], () => db, production.marker);
  await repository.run(() => {
    assert.equal(state[0].testMode, false);
    assert.equal(state[0].razorpayKeyId, '');
  }, true);
  assert.deepEqual(reads, [production.marker, production.collection]);
  assert.deepEqual(writes.map(write => write.collection), [production.collection, production.marker]);
});

test('deleted Firestore settings cannot leave previous gateway credentials active', () => {
  const service = new PaymentService();
  const initial = service.getMaskedSettings().maskedRazorpayKeySecret;
  service.updateSettings({ razorpayKeySecret: 'overridden_custom_secret_1234567' });
  assert.notEqual(service.getMaskedSettings().maskedRazorpayKeySecret, initial);
  service.settingsState.importState([]);
  assert.equal(service.getMaskedSettings().maskedRazorpayKeySecret, initial);
});
