import test from 'node:test';
import assert from 'node:assert/strict';
import {ANNUAL_PASS_CHECKOUT, safeCheckoutReturn, checkoutLoginUrl, hasCheckoutSession, loginContinuation} from '../src/lib/auth/checkoutReturn';
import {fetchPublicAnnualPassConfig} from '../src/lib/payments/publicAnnualPassConfig';

const priceResponse = {success: true, settings: {enabled: true, name: 'Annual Pass', currency: 'INR', durationDays: 365, regularPrice: 1999, salePrice: 999, benefits: ['Published learning resources']}, effectivePriceINR: 999, taxRatePercentage: 18, checkoutEnabled: false};

test('checkout intent preserves plan and coupon through the login URL and a refresh', () => {
  const target = '/checkout?plan=annual-pass&coupon=BOARD2026';
  const login = checkoutLoginUrl(target);
  const params = new URL(login, 'https://mayf.test').searchParams;
  assert.equal(params.get('returnTo'), target);
  assert.equal(safeCheckoutReturn(params.get('returnTo')), target);
  assert.equal(loginContinuation(false, true, params.get('returnTo'), '/dashboard'), target);
});

test('external, administrative and malformed return targets are rejected', () => {
  for (const value of [null, undefined, 123, '', 'https://attacker.test/checkout', '//attacker.test/checkout', '/\\attacker.test/checkout', '/admin-portal', '/login?returnTo=/checkout', '/checkout/../../admin-portal', '/checkout%2f..%2fadmin', '/checkout\n?x=1', 'javascript:alert(1)', '%2f%2fattacker.test']) {
    assert.equal(safeCheckoutReturn(value), null, String(value));
    assert.equal(loginContinuation(false, true, value, '/dashboard'), '/dashboard');
  }
  assert.equal(checkoutLoginUrl('//attacker.test'), checkoutLoginUrl(ANNUAL_PASS_CHECKOUT));
});

test('only a real nonanonymous Firebase session satisfies production checkout', () => {
  assert.equal(hasCheckoutSession(null, {uid: 'forged-profile'}, true), false);
  assert.equal(hasCheckoutSession({uid: 'anonymous', isAnonymous: true}, {uid: 'forged-profile'}, true), false);
  assert.equal(hasCheckoutSession({uid: 'verified', isAnonymous: false}, null, true), true);
  assert.equal(hasCheckoutSession(null, {uid: 'local-preview'}, false), true);
});

test('auth restoration and cancelled login do not consume the checkout intent', () => {
  assert.equal(loginContinuation(true, false, ANNUAL_PASS_CHECKOUT, null), null);
  assert.equal(loginContinuation(true, true, ANNUAL_PASS_CHECKOUT, '/dashboard'), null);
  assert.equal(loginContinuation(false, false, ANNUAL_PASS_CHECKOUT, '/dashboard'), null);
  assert.equal(loginContinuation(false, true, ANNUAL_PASS_CHECKOUT, null), ANNUAL_PASS_CHECKOUT);
  assert.equal(loginContinuation(false, true, null, null), null);
  assert.equal(loginContinuation(false, true, null, '/dashboard'), '/dashboard');
});

test('visitors receive the actual public price even while global payments are paused', async () => {
  const result = await fetchPublicAnnualPassConfig({request: (async (url, init) => {
    assert.equal(url, '/api/annual-pass/config');
    assert.equal(init?.credentials, 'omit');
    assert.equal(new Headers(init?.headers).has('Authorization'), false);
    return new Response(JSON.stringify(priceResponse), {headers: {'Content-Type': 'application/json'}});
  }) as typeof fetch});
  assert.equal(result.effectivePriceINR, 999);
  assert.equal(result.checkoutEnabled, false);
});

test('malformed and failed public pricing never become an invented display price', async () => {
  for (const body of [{...priceResponse, effectivePriceINR: null}, {...priceResponse, effectivePriceINR: -1}, {...priceResponse, settings: null}, {...priceResponse, taxRatePercentage: '18'}, {...priceResponse, settings: {...priceResponse.settings, benefits: null}}]) {
    await assert.rejects(fetchPublicAnnualPassConfig({request: (async () => new Response(JSON.stringify(body))) as typeof fetch}), /could not be loaded/);
  }
  await assert.rejects(fetchPublicAnnualPassConfig({request: (async () => new Response('Unauthorized', {status: 401})) as typeof fetch}), /could not be loaded/);
});

test('stalled public pricing requests time out with a retryable message', async () => {
  await assert.rejects(fetchPublicAnnualPassConfig({timeoutMs: 5, request: ((_url, init) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), {once: true});
  })) as typeof fetch}), /Please retry/);
});
