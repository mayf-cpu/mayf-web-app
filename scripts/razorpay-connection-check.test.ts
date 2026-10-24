import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RazorpayAdapter } from '../src/lib/payments/adapters/razorpayAdapter';
process.env.APP_ENV = 'staging';
const adapter = () => new RazorpayAdapter({ keyId: 'rzp_test_Unit123', secretKey: 'unit-test-private-value', testMode: true });

test('connection check only reads one test order and discards private gateway records', async () => {
  const result = await adapter().verifyTestConnection((async (url, init) => {
    assert.equal(url, 'https://api.razorpay.com/v1/orders?count=1');
    assert.equal(init!.method, 'GET'); assert.equal(init!.redirect, 'manual');
    assert.equal(init!.body, undefined);
    assert.match((init!.headers as any).Authorization, /^Basic /);
    return new Response(JSON.stringify({ entity: 'collection', count: 1, items: [{ id: 'private-order', notes: { email: 'private@example.com' } }] }));
  }) as typeof fetch);
  assert.equal(result, undefined);
});

test('live keys, wrong mode and production runtime never send a connection probe', async () => {
  let calls = 0;
  const fetcher = (async () => { calls++; return new Response(); }) as typeof fetch;
  for (const config of [{ keyId: 'rzp_live_Unit123', testMode: false }, { keyId: 'rzp_test_Unit123', testMode: false }]) {
    await assert.rejects(new RazorpayAdapter({ ...config, secretKey: 'unit-secret' }).verifyTestConnection(fetcher), /staging/);
  }
  process.env.APP_ENV = 'production';
  try { await assert.rejects(adapter().verifyTestConnection(fetcher), /staging/); }
  finally { process.env.APP_ENV = 'staging'; }
  assert.equal(calls, 0);
});

test('connection errors never expose raw credential or gateway response details', async () => {
  for (const response of [new Response('private raw detail', { status: 401 }), new Response('private raw detail', { status: 500 }), new Response('private raw detail', { status: 302 }), new Response('{}')]) {
    await assert.rejects(adapter().verifyTestConnection((async () => response) as typeof fetch), error => {
      assert.doesNotMatch(String(error), /private raw detail|unit-test-private-value/); return true;
    });
  }
  await assert.rejects(adapter().verifyTestConnection((async () => { throw new Error('unit-test-private-value'); }) as typeof fetch), /unavailable/);
});
