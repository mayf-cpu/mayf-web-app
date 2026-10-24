import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DurablePaymentRepository } from '../src/lib/payments/durablePaymentRepository';
import type { FirestoreDocumentStore } from '../src/lib/firebase/documentStore';

test('webhook audit reads durable settlements after restart and never exposes extra payload fields', async () => {
  const rows = [{ id: 'a', data: { provider: 'razorpay', eventId: 'event-paid', orderId: 'ord', providerOrderId: 'order_1', providerPaymentId: 'pay_1', processedAt: '2026-10-24T12:00:00Z', rawBody: 'PRIVATE', webhookSecret: 'SECRET' } },
    { id: 'b', data: { provider: 'razorpay', eventId: 'event-refund', orderId: 'ord', providerPaymentId: 'pay_1', refundId: 'rfnd_1', processedAt: '2026-10-24T13:00:00Z' } }];
  const db = { list: async (collection: string) => { assert.equal(collection, 'paymentWebhookEvents'); return rows; } } as unknown as FirestoreDocumentStore;
  const first = await new DurablePaymentRepository(db).getWebhookEvents();
  const restarted = await new DurablePaymentRepository(db).getWebhookEvents();
  assert.deepEqual(first, restarted);
  assert.deepEqual(first.map(row => row.outcome), ['refunded', 'paid']);
  assert.equal(first[0].refundId, 'rfnd_1');
  assert.ok(!JSON.stringify(first).includes('PRIVATE'));
  assert.ok(!JSON.stringify(first).includes('SECRET'));
});

test('unavailable durable webhook storage rejects instead of claiming an empty audit', async () => {
  const db = { list: async () => { throw new Error('storage offline'); } } as unknown as FirestoreDocumentStore;
  await assert.rejects(new DurablePaymentRepository(db).getWebhookEvents(), /storage offline/);
});

test('webhook audit returns latest 100 settlements in reverse chronological order', async () => {
  const db = { list: async () => Array.from({ length: 125 }, (_, index) => ({ data: { provider: 'razorpay', eventId: String(index), processedAt: new Date(Date.UTC(2026, 9, 24, 0, index)).toISOString() } })) } as unknown as FirestoreDocumentStore;
  const result = await new DurablePaymentRepository(db).getWebhookEvents();
  assert.equal(result.length, 100); assert.equal(result[0].eventId, '124'); assert.equal(result[99].eventId, '25');
});

test('audit remains admin-only and fails closed without durable storage', () => {
  const source = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  const route = source.slice(source.indexOf("app.get('/api/admin/payments/webhook-logs'"), source.indexOf(' * 9. Admin Webhook Simulator'));
  assert.match(route, /requireAuth, requireAdmin/);
  assert.match(route, /if \(!db\) return res.status\(503\)/);
  assert.match(route, /new DurablePaymentRepository\(db\).getWebhookEvents\(\)/);
  assert.doesNotMatch(route, /paymentService.getWebhookLogs/);
});
