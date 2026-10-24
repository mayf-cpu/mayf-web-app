import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validatePaymentAcceptanceConfig } from './payment-acceptance-isolation.mjs';
const staging = JSON.parse(readFileSync(new URL('../wrangler.staging.jsonc', import.meta.url), 'utf8'));
const acceptance = JSON.parse(readFileSync(new URL('../wrangler.acceptance.jsonc', import.meta.url), 'utf8'));

test('sandbox acceptance changes only isolated staging checkout and refund flags', () => {
  assert.doesNotThrow(() => validatePaymentAcceptanceConfig(acceptance, staging));
  assert.equal(acceptance.vars.MAYF_ENABLE_PAYMENT_SIMULATION, 'false');
  assert.equal(acceptance.vars.MAYF_ENABLE_COUPON_CHECKOUT, 'false');
});

test('sandbox acceptance rejects production routes, bucket drift, live environment and extra credentials', () => {
  for (const mutation of [
    (c: any) => c.name = 'production',
    (c: any) => c.routes = ['mayf.co.in/*'],
    (c: any) => c.r2_buckets[0].bucket_name = 'mayf-study-materials',
    (c: any) => c.vars.APP_ENV = 'production',
    (c: any) => c.vars.PUBLIC_APP_URL = 'https://mayf.co.in',
    (c: any) => c.vars.MAYF_ENABLE_PAYMENT_SIMULATION = 'true',
    (c: any) => c.vars.RAZORPAY_KEY_SECRET = 'unreviewed-secret',
  ]) {
    const changed = structuredClone(acceptance); mutation(changed);
    assert.throws(() => validatePaymentAcceptanceConfig(changed, staging));
  }
});

test('manual sandbox window is opt-in and normal staging remains the default', () => {
  const workflow = readFileSync(new URL('../.github/workflows/deploy-staging.yml', import.meta.url), 'utf8');
  assert.match(workflow, /enable_payment_acceptance:[\s\S]*?default: false/);
  assert.match(workflow, /if \[ "\$STAGING_PAYMENT_ACCEPTANCE" = "true" \]/);
  assert.match(workflow, /else\s+echo "STAGING_WRANGLER_CONFIG=wrangler.staging.jsonc"/);
  assert.match(workflow, /--config "\$STAGING_WRANGLER_CONFIG"/);
});
