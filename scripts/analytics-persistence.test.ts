import test from 'node:test';
import assert from 'node:assert/strict';
import { AggregateMetricsService } from '../src/lib/analytics/aggregateMetricsService';
function fixture() {
  const values = new Map<string, { data: any; version: string }>(); let version = 0;
  const store = {
    list: async (collection: string) => [...values.entries()].filter(([key]) => key.startsWith(collection + '/')).map(([key, value]) => ({ id: key.split('/')[1], data: structuredClone(value.data), updateTime: value.version })),
    collection: (collection: string) => ({ doc: (id: string) => ({
      get: async () => { const value = structuredClone(values.get(collection + '/' + id)); return { exists: !!value, updateTime: value?.version, data: () => value?.data }; },
      set: async (data: any, condition?: any) => {
        await Promise.resolve(); const key = collection + '/' + id; const old = values.get(key);
        if (condition?.exists === false && old || condition?.updateTime && condition.updateTime !== old?.version) throw new Error('412 conflict');
        values.set(key, { data: structuredClone(data), version: String(++version) });
      },
    }) }),
  };
  let now = Date.parse('2026-10-21T12:00:00Z');
  return { store, fresh: () => new AggregateMetricsService(() => store as any, () => now), time: (value: string) => { now = Date.parse(value); } };
}
test('analytics starts empty and public purchase/download/AI events cannot fabricate counters', async () => {
  const f = fixture();
  for (const type of ['purchase', 'annual_pass_purchase', 'content_download', 'ai_question'] as const) assert.equal(await f.fresh().recordEvent(type, { value: 999999 }), false);
  const data = await f.fresh().getDashboardMetrics();
  assert.equal(data.summary.revenue.totalRevenue, 0); assert.equal(data.summary.downloads.total, 0);
  assert.equal(data.summary.conversion.overallConversionRate, 0); assert.deepEqual(data.popularContent, []);
});
test('concurrent activity survives restarts and timeframe uses IST calendar days', async () => {
  const f = fixture();
  await Promise.all([f.fresh().recordEvent('page_view'), f.fresh().recordEvent('page_view'), f.fresh().recordEvent('content_view', { content_id: 'one', title: 'One' })]);
  await f.fresh().recordEvent('content_download', { content_id: 'one' }, true);
  assert.equal((await f.fresh().getDashboardMetrics('today')).summary.traffic.totalPageViews, 2);
  f.time('2026-10-21T18:31:00Z');
  assert.equal((await f.fresh().getDashboardMetrics('today')).summary.traffic.totalPageViews, 0);
  assert.equal((await f.fresh().getDashboardMetrics('7d')).summary.downloads.total, 1);
  assert.equal((await f.fresh().getDashboardMetrics('all')).popularContent[0].downloads, 1);
});
test('analytics uses paid ledger totals, separates currencies, and excludes refunded or pending orders', async () => {
  const f = fixture();
  for (const [id, status, currency] of [['a', 'paid', 'INR'], ['b', 'paid', 'USD'], ['c', 'refunded', 'INR'], ['d', 'pending', 'INR']]) {
    await f.store.collection('paymentOrders').doc(id).set({ status, currency, grossAmount: 100, discount: 10, tax: 5, createdAt: '2026-10-21T10:00:00Z', paidAt: '2026-10-21T11:00:00Z' });
  }
  const data = await f.fresh().getDashboardMetrics('today');
  assert.equal(data.summary.orders.completedOrders, 2); assert.equal(data.summary.orders.pendingOrders, 1);
  assert.equal(data.summary.revenue.totalRevenue, 95); assert.deepEqual(data.summary.revenue.byCurrency, { INR: 95, USD: 95 });
  assert.equal(data.summary.orders.averageOrderValue, 95);
});


test('analytics fails closed without Firestore instead of presenting invented numbers', async () => {
  const unavailable = new AggregateMetricsService(() => null);
  await assert.rejects(unavailable.getDashboardMetrics('30d'), /Analytics storage is not configured/);
  await assert.rejects(unavailable.recordEvent('page_view'), /Analytics storage is not configured/);
});

test('analytics rejects client-asserted purchase events and awaits durable route writes', async () => {
  const f = fixture();
  assert.equal(await f.fresh().recordEvent('purchase', { currency: 'INR', value: 10000000 }), false);
  assert.equal(await f.fresh().recordEvent('ai_question', { math_category: 'Calculus' }), false);
  assert.equal((await f.fresh().getDashboardMetrics('today')).summary.revenue.totalRevenue, 0);
});


test('dashboard reads the actual paymentOrders and paymentEntitlements collections', async () => {
  const f = fixture();
  await f.store.collection('paymentOrders').doc('order-1').set({
    status: 'paid', currency: 'INR', grossAmount: 999, discount: 99, tax: 0,
    createdAt: '2026-10-21T09:00:00Z', paidAt: '2026-10-21T10:00:00Z',
  });
  await f.store.collection('paymentEntitlements').doc('pass-1').set({
    type: 'annual_pass', status: 'active', startsAt: '2026-10-20T10:00:00Z',
    expiresAt: '2027-10-20T10:00:00Z', createdAt: '2026-10-21T10:00:00Z',
  });
  const report = await f.fresh().getDashboardMetrics('30d');
  assert.equal(report.summary.revenue.totalRevenue, 900);
  assert.equal(report.summary.orders.completedOrders, 1);
  assert.equal(report.summary.annualPassSubscriptions.activePasses, 1);
});
