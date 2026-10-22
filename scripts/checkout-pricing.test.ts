import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCheckoutCart } from '../src/lib/payments/checkoutPricing';
import { EntitlementService } from '../src/lib/payments/entitlementService';

const pass = new EntitlementService().getSettings();
const now = Date.parse('2026-10-21');
const product = { id: 'resource-1', title: 'Actual resource', price: 449, accessType: 'paid', visible: true, status: 'published' };
const resolve = (items: unknown, currency: unknown = 'INR', settings = pass, item = product) => resolveCheckoutCart(items, currency, settings, id => id === item.id ? item : null, now);

test('checkout replaces forged prices, titles and pass flags with canonical product data', () => {
  const cart = resolve([{ id: product.id, title: 'Annual Pass', unitPrice: 0.01, annualPass: true }]);
  assert.equal(cart.grossAmount, 449);
  assert.equal(cart.items[0].title, product.title);
  assert.equal(cart.items[0].annualPass, false);
  assert.equal(cart.items[0].contentItemId, product.id);
});
test('pass checkout uses configured prices and respects enabled and promotional dates', () => {
  assert.equal(resolve([]).grossAmount, pass.salePrice);
  assert.equal(resolve([], 'INR', { ...pass, promotionalEndDate: '2026-09-01' }).grossAmount, pass.regularPrice);
  assert.throws(() => resolve([], 'INR', { ...pass, enabled: false }), /unavailable/);
  assert.throws(() => resolve([], 'INR', { ...pass, salePrice: NaN }), /price/);
});
test('unknown, hidden, archived and free resources cannot enter the paid cart', () => {
  assert.throws(() => resolve([{ id: 'arbitrary-pass-name', annualPass: true }]), /available/);
  for (const patch of [{ visible: false }, { status: 'archived' }, { accessType: 'free' }, { price: NaN }]) {
    assert.throws(() => resolve([{ id: product.id }], 'INR', pass, { ...product, ...patch }));
  }
});
test('invalid cart types, quantities, duplicates and currencies fail before gateway creation', () => {
  for (const items of [null, {}, [null], [{ id: product.id, quantity: -1 }], [{ id: product.id, quantity: 1.5 }], [{ id: product.id }, { id: product.id }], [{ id: 'annual-pass' }, { id: 'item-annual-pass' }]]) assert.throws(() => resolve(items));
  for (const currency of [null, {}, 'EUR', '']) assert.throws(() => resolve([], currency), /currency/);
  assert.throws(() => resolve([{ id: product.id }], 'USD'), /INR/);
});
