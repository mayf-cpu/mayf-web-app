import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedRequestOrigin } from '../src/lib/security/requestOrigin';
test('same deployment saves pass on production and Cloudflare preview; cross-site writes fail', () => {
  const host = 'fix-backend-runtime-firebase-mayf.sachinagrawal16.workers.dev';
  assert.equal(isAllowedRequestOrigin(`https://${host}`, host), true);
  assert.equal(isAllowedRequestOrigin('https://mayf.co.in', 'mayf.co.in'), true);
  for (const origin of ['https://attacker.workers.dev', 'https://mayf.co.in.attacker.test', 'null', 'javascript:alert(1)', `http://${host}`, `https://${host}:444`, `https://user:pass@${host}`]) {
    assert.equal(isAllowedRequestOrigin(origin, host), false, origin);
  }
});
