import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gatewaySettingsUpdate, requestGatewaySettings } from '../src/lib/payments/adminSettingsClient';

test('blank and masked secrets cannot replace stored credentials', () => {
  const input = { razorpayKeySecret: ' ', razorpayWebhookSecret: '••••1234', stripeSecretKey: ' new-test-secret ', testMode: true };
  assert.deepEqual(gatewaySettingsUpdate(input), { stripeSecretKey: 'new-test-secret', testMode: true });
  assert.equal(input.stripeSecretKey, ' new-test-secret ');
});

test('gateway settings read and save use authenticated API and server acknowledgement', async () => {
  const settings = { activeProvider: 'razorpay', testMode: true };
  const calls: any[] = [];
  const fetcher = async (url: any, options: any) => { calls.push({ url, options }); return new Response(JSON.stringify({ success: true, settings })); };
  assert.deepEqual(await requestGatewaySettings({ Authorization: 'Bearer test-session' }, undefined, fetcher as typeof fetch), settings);
  assert.deepEqual(await requestGatewaySettings({ Authorization: 'Bearer test-session' }, { testMode: true, razorpayKeySecret: '' }, fetcher as typeof fetch), settings);
  assert.equal(calls[0].url, '/api/admin/payments/settings');
  assert.equal(calls[0].options.method, 'GET');
  assert.equal(calls[1].options.method, 'POST');
  assert.equal(calls[1].options.headers.Authorization, 'Bearer test-session');
  assert.deepEqual(JSON.parse(calls[1].options.body), { testMode: true });
});

test('failed or malformed gateway responses never report settings saved', async () => {
  for (const response of [new Response('{}', { status: 503 }), new Response('{"success":false}'), new Response('not-json')]) {
    await assert.rejects(requestGatewaySettings({}, { testMode: true }, (async () => response) as typeof fetch), /not saved/);
  }
});
