import test from 'node:test';
import assert from 'node:assert/strict';
import { readStudentOrders, readStudentActivity } from '../src/lib/admin/studentHistory';
const store = (data: any[]) => ({ queryEqual: async (collection: string) => { assert.ok(['paymentOrders', 'activityLogs'].includes(collection)); return data; } }) as any;
test('student order history uses exact account ownership, genuine totals and currency', async () => {
  const order = { orderId: 'one', userId: 'student-a', providerOrderId: 'provider-one', grossAmount: 100, discount: 10, tax: 5, currency: 'USD', provider: 'stripe', status: 'paid', createdAt: '2026-10-21T10:00:00Z', items: [{ title: 'One resource' }] };
  const db = store([{ id: 'one', data: order }, { id: 'two', data: { ...order, orderId: 'two', userId: 'student-b' } }]);
  const result = await readStudentOrders(db, 'student-a');
  assert.equal(result.length, 1); assert.equal(result[0].id, 'one'); assert.equal(result[0].amount, 95); assert.equal(result[0].currency, 'USD'); assert.equal(result[0].paymentId, '');
  assert.deepEqual(await readStudentOrders(db, 'unknown'), []);
});
test('student activity excludes other users, sample rows, expired and future records', async () => {
  const now = Date.parse('2026-10-21T10:00:00Z');
  const good = { userId: 'student-a', eventType: 'formula_view', title: 'Viewed formula', createdAt: '2026-10-21T09:00:00Z' };
  const db = store([{ id: 'good', data: good }, { id: 'other', data: { ...good, userId: 'student-b' } }, { id: 'act-sample-1', data: good }, { id: 'old', data: { ...good, createdAt: '2026-08-01T00:00:00Z' } }, { id: 'future', data: { ...good, createdAt: '2027-01-01T00:00:00Z' } }]);
  const rows = await readStudentActivity(db, 'student-a', now);
  assert.deepEqual(rows.map(row => row.id), ['good']); assert.match(rows[0].description, /Client-reported/);
});
test('missing student history storage is an explicit failure rather than a successful empty list', async () => {
  await assert.rejects(readStudentOrders(null, 'student'), /unavailable/);
  await assert.rejects(readStudentActivity(null, 'student'), /unavailable/);
});
