import { hasPurchasedContentAccess } from '../src/lib/payments/contentAccess';
import { sealGatewaySettings, openGatewaySettings } from '../src/lib/payments/settingsEncryption';
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { PaymentService } from '../src/lib/payments/paymentService';
import { EntitlementService } from '../src/lib/payments/entitlementService';
import { CouponService } from '../src/lib/coupons/couponService';
import { createCommerceRepository } from '../src/lib/payments/commerceRepository';

const secret = 'commerce-test-signing-secret';
function fixture() {
  const documents = new Map<string, any>();
  let revision = 0;
  let fail = false;
  const store = {
    collection: (collection: string) => ({ doc: (id: string) => ({ get: async () => ({ exists: documents.has(`${collection}/${id}`), updateTime: documents.get(`${collection}/${id}`)?.updateTime }) }) }),
    list: async (collection: string) => structuredClone([...documents].filter(([key]) => key.startsWith(`${collection}/`)).map(([, value]) => value)),
    commit: async (changes: any[]) => {
      if (fail) throw new Error('storage unavailable');
      for (const change of changes) assert.equal(change.updateTime, documents.get(`${change.collection}/${change.id}`)?.updateTime, 'stale conditional write');
      for (const change of changes) {
        const key = `${change.collection}/${change.id}`;
        if (change.data) documents.set(key, { id: change.id, data: structuredClone(change.data), updateTime: String(++revision) });
        else documents.delete(key);
      }
    },
  };
  const fresh = () => {
    const coupons = new CouponService(); coupons.couponState.importState([]); coupons.promotionState.importState([]);
    const payments = new PaymentService(coupons);
    payments.orderState.importState([]); payments.webhookState.importState([]);
    payments.updateSettings({ testMode: false, razorpayKeySecret: secret, razorpayWebhookSecret: secret });
    const entitlements = new EntitlementService();
    entitlements.entitlementState.importState([]); entitlements.historyState.importState([]);
    const repository = createCommerceRepository(payments, entitlements, coupons, () => store as any);
    return { payments, entitlements, coupons, repository };
  };
  return { fresh, fail: () => { fail = true; } };
}
function putOrder(state: ReturnType<ReturnType<typeof fixture>['fresh']>) {
  state.payments.orderState.importState([{ id: 'qa-order', orderId: 'qa-order', userId: 'qa-student', items: [{ id: 'item-annual-pass', title: 'Pass', annualPass: true, quantity: 1, unitPrice: 999 }], grossAmount: 999, discount: 100, tax: 0, coupon: 'QA100', currency: 'INR', provider: 'razorpay', providerOrderId: 'order_qa', status: 'created', createdAt: new Date().toISOString() }]);
  state.coupons.saveCoupon({ code: 'QA100', discountValue: 100 });
}
const callback = { orderId: 'qa-order', userId: 'qa-student', provider: 'razorpay' as const, providerOrderId: 'order_qa', providerPaymentId: 'pay_qa', signature: crypto.createHmac('sha256', secret).update('order_qa|pay_qa').digest('hex') };
async function fulfill(state: ReturnType<ReturnType<typeof fixture>['fresh']>) {
  const verified = await state.payments.verifyPaymentSignature(callback);
  assert.equal(verified.success, true);
  state.entitlements.createOrRenewFromPayment({ userId: verified.order!.userId, orderId: verified.order!.orderId, paymentId: verified.order!.providerPaymentId });
}
test('orders, verified payment, coupon use and membership survive restart without duplicate grants', async () => {
  const { fresh } = fixture();
  let state = fresh(); await state.repository.run(() => putOrder(state), true);
  state = fresh(); await state.repository.run(() => fulfill(state), true);
  state = fresh();
  await state.repository.run(async () => {
    assert.equal(state.payments.getOrder('qa-order')?.status, 'paid');
    assert.equal(state.entitlements.checkActiveEntitlement('qa-student').active, true);
    await fulfill(state);
    assert.equal(state.entitlements.getAllEntitlements().length, 1);
    assert.equal(state.coupons.getCoupon('QA100')?.timesUsed, 1);
  }, true);
});
test('failed atomic payment commit rolls back order, redemption and entitlement together', async () => {
  const scenario = fixture(); const state = scenario.fresh();
  await state.repository.run(() => putOrder(state), true);
  scenario.fail();
  await assert.rejects(state.repository.run(() => fulfill(state), true), /unavailable/);
  assert.equal(state.payments.getOrder('qa-order')?.status, 'created');
  assert.equal(state.entitlements.getAllEntitlements().length, 0);
  assert.equal(state.coupons.getCoupon('QA100')?.timesUsed, 0);
});
test('webhook deduplication survives restart and a callback after a webhook cannot redeem twice', async () => {
  const { fresh } = fixture(); let state = fresh();
  await state.repository.run(() => putOrder(state), true);
  const body = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_qa', order_id: 'order_qa', amount: 89900, currency: 'INR' } } } });
  const headers = { 'x-razorpay-event-id': 'evt_qa', 'x-razorpay-signature': crypto.createHmac('sha256', secret).update(body).digest('hex') };
  await state.repository.run(async () => { assert.equal((await state.payments.handleWebhook('razorpay', headers, body)).status, 'processed'); await fulfill(state); }, true);
  state = fresh();
  await state.repository.run(async () => {
    assert.equal((await state.payments.handleWebhook('razorpay', headers, body)).status, 'duplicate_ignored');
    await fulfill(state);
    assert.equal(state.coupons.getCoupon('QA100')?.timesUsed, 1);
    assert.equal(state.entitlements.getAllEntitlements().length, 1);
  }, true);
});
test('gateway and pass settings persist and gateway API output masks private values', async () => {
  const { fresh } = fixture(); let state = fresh();
  await state.repository.run(() => { state.payments.updateSettings({ taxRatePercentage: 0 }); state.entitlements.updateSettings({ salePrice: 777 }); }, true);
  state = fresh();
  await state.repository.run(() => {
    assert.equal(state.payments.getMaskedSettings().taxRatePercentage, 0);
    assert.equal(state.entitlements.getSettings().salePrice, 777);
    assert.equal(JSON.stringify(state.payments.getMaskedSettings()).includes(secret), false);
  });
});
test('renewal adds time after the existing expiry and remains idempotent', () => {
  const service = new EntitlementService(); service.entitlementState.importState([]);
  const first = service.createOrRenewFromPayment({ userId: 'qa', orderId: 'first', durationDays: 30 });
  const renewal = service.createOrRenewFromPayment({ userId: 'qa', orderId: 'second', durationDays: 30 });
  assert.equal(Date.parse(renewal.expiresAt) - Date.parse(first.expiresAt), 30 * 86400000);
  assert.equal(service.createOrRenewFromPayment({ userId: 'qa', orderId: 'second' }).id, renewal.id);
  assert.throws(() => service.createOrRenewFromPayment({ userId: 'other', orderId: 'second' }), /different student/);
});

test('persisted gateway credentials are encrypted and tampering is rejected', () => {
  const service = new PaymentService();
  service.updateSettings({ razorpayKeySecret: secret });
  const sealed: Record<string, any> = service.settingsState.exportState()[0];
  assert.equal(JSON.stringify(sealed).includes(secret), false);
  const { id, ...payload } = sealed;
  assert.equal(openGatewaySettings(payload).razorpayKeySecret, secret);
  payload.encryptedCredentials.tag = Buffer.alloc(16).toString('base64');
  assert.throws(() => openGatewaySettings(payload), /decrypt/);
});
test('paid item access is scoped to its buyer and product and ends on refund', () => {
  const { payments, entitlements } = fixture().fresh();
  payments.orderState.importState([{ id: 'item-order', orderId: 'item-order', userId: 'buyer', items: [{ contentItemId: 'resource-a', annualPass: false }], status: 'paid' }]);
  const buyer = { valid: true, uid: 'buyer' } as any;
  assert.equal(hasPurchasedContentAccess(buyer, { id: 'resource-a' }, payments, entitlements), true);
  assert.equal(hasPurchasedContentAccess(buyer, { id: 'resource-b' }, payments, entitlements), false);
  assert.equal(hasPurchasedContentAccess({ valid: true, uid: 'other' } as any, { id: 'resource-a' }, payments, entitlements), false);
  payments.getOrder('item-order')!.status = 'refunded';
  assert.equal(hasPurchasedContentAccess(buyer, { id: 'resource-a' }, payments, entitlements), false);
});
