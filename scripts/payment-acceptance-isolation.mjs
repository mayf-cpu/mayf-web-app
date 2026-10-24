import assert from 'node:assert/strict';

/** A test window may change only checkout/refund flags on the same isolated Worker. */
export function validatePaymentAcceptanceConfig(acceptance, staging) {
  assert.equal(staging.name, 'staging-acceptance-mayf');
  assert.equal(staging.vars.APP_ENV, 'staging');
  assert.equal(staging.vars.PUBLIC_APP_URL, 'https://staging-acceptance-mayf.sachinagrawal16.workers.dev');
  assert.equal(staging.vars.MAYF_ENABLE_CHECKOUT, 'false');
  assert.equal(staging.vars.MAYF_ENABLE_ADMIN_REFUNDS, 'false');
  assert.deepEqual(acceptance, {
    ...staging,
    vars: { ...staging.vars, MAYF_ENABLE_CHECKOUT: 'true', MAYF_ENABLE_ADMIN_REFUNDS: 'true' },
  }, 'Acceptance may enable only checkout/refunds on isolated staging; all other configuration must match');
}
