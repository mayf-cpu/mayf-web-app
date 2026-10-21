import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateAnnualPassCart, isSupportedLaunchPaymentMethod } from '../src/lib/payments/checkoutPolicy';

test('only a single annual pass with quantity one is accepted', () => {
  assert.equal(validateAnnualPassCart([]), true);
  assert.equal(validateAnnualPassCart([{ annualPass: true, quantity: 1, unitPrice: 0 }]), true);
  for (const cart of [
    null, 'pass', {}, [{ annualPass: false, unitPrice: 1 }],
    [{ id: 'pass', quantity: 1 }],
    [{ annualPass: true, quantity: 2 }],
    [{ annualPass: true }, { annualPass: true }],
    [{ annualPass: true, quantity: 0 }],
    [{ annualPass: true, quantity: 'not-a-number' }],
  ]) assert.equal(validateAnnualPassCart(cart), false);
});

test('release only accepts INR Razorpay despite stored auto gateway settings', () => {
 for (const provider of [undefined, null, 'auto', 'razorpay']) {
   assert.equal(isSupportedLaunchPaymentMethod('INR', provider), true);
   assert.equal(isSupportedLaunchPaymentMethod('inr', provider), true);
 }
 for (const [currency, provider] of [
   ['USD', 'stripe'], ['INR', 'stripe'], ['EUR', 'auto'], ['GBP', undefined],
   ['INR', 'anything'], ['', 'razorpay'], [undefined, 'razorpay'],
 ]) assert.equal(isSupportedLaunchPaymentMethod(currency, provider), false);
});
