import assert from 'node:assert/strict';
import test from 'node:test';
import { assertReleaseCheckout } from '../src/lib/payments/checkoutPolicy';
import { PaymentService } from '../src/lib/payments/paymentService';
import { RazorpayAdapter } from '../src/lib/payments/adapters/razorpayAdapter';
import { StripeAdapter } from '../src/lib/payments/adapters/stripeAdapter';
const request = { userId: 'qa', items: [{ id: 'pass', title: 'Pass', unitPrice: 100, quantity: 1, annualPass: true }], grossAmount: 100, currency: 'INR' };
test('deferred Stripe, unknown providers and non-INR currency cannot start a checkout', async t => {
  const stripe = t.mock.method(StripeAdapter.prototype, 'createOrder', async () => { throw new Error('Must not call Stripe'); });
  const razorpay = t.mock.method(RazorpayAdapter.prototype, 'createOrder', async () => { throw new Error('Must not call Razorpay'); });
  const service = new PaymentService();
  for (const override of [{ preferredProvider: 'stripe' }, { preferredProvider: 'unknown' }, { currency: 'USD' }, { currency: {} }]) {
    await assert.rejects(service.createOrder({ ...request, ...override } as any), /currently/);
  }
  assert.equal(stripe.mock.callCount(), 0); assert.equal(razorpay.mock.callCount(), 0);
  assert.doesNotThrow(() => assertReleaseCheckout(undefined, 'INR'));
});
test('a previously saved Stripe default cannot silently reroute an INR order', async t => {
  const razorpay = t.mock.method(RazorpayAdapter.prototype, 'createOrder', async () => ({
    provider: 'razorpay' as const, providerOrderId: 'order_qa', amountInSubunits: 11800, currency: 'INR', keyId: 'rzp_test_qa',
  }));
  const service = new PaymentService({ createOrder: async () => {} });
  service.updateSettings({ activeProvider: 'stripe' });
  assert.equal((await service.createOrder(request)).order.provider, 'razorpay');
  assert.equal(razorpay.mock.callCount(), 1);
});
