import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DurablePaymentRepository } from '../src/lib/payments/durablePaymentRepository';
import type { FirestoreDocumentStore } from '../src/lib/firebase/documentStore';

const a = { orderId: 'order-a', userId: 'student-a', createdAt: '2026-10-20T00:00:00Z' };
const b = { orderId: 'order-b', userId: 'student-b', createdAt: '2026-10-21T00:00:00Z' };
const c = { orderId: 'order-c', userId: 'student-a', createdAt: '2026-10-22T00:00:00Z' };
const fixture = (fail = false) => {
  const calls: unknown[][] = [];
  const store = {
    queryEqual: async (...args: unknown[]) => {
      calls.push(args);
      if (fail) throw new Error('Firestore unavailable');
      return [a, c].map((data, i) => ({ id: String(i), data, updateTime: 'revision' }));
    },
    list: async (collection: string) => {
      if (fail) throw new Error('Firestore unavailable');
      assert.equal(collection, 'paymentOrders');
      return [a, b, c].map((data, i) => ({ id: String(i), data, updateTime: 'revision' }));
    },
  };
  return { repository: new DurablePaymentRepository(store as unknown as FirestoreDocumentStore), calls };
};
test('student order lookup is scoped to verified UID and ordered newest-first', async () => {
  const { repository, calls } = fixture();
  const result = await repository.getStudentOrders('student-a');
  assert.deepEqual(result.map(x => x.orderId), ['order-c', 'order-a']);
  assert.deepEqual(calls[0], ['paymentOrders', 'userId', 'student-a']);
  assert.equal(result.some(x => x.userId === 'student-b'), false);
});
test('student identity cannot be blank and database failures never become empty history', async () => {
  const { repository } = fixture(true);
  await assert.rejects(repository.getStudentOrders(''), /Student identifier/);
  await assert.rejects(repository.getStudentOrders('student-a'), /Firestore unavailable/);
  await assert.rejects(repository.getAllOrders(), /Firestore unavailable/);
});
test('admin order ledger reads persisted orders instead of Worker-local memory', async () => {
  const { repository } = fixture();
  assert.deepEqual((await repository.getAllOrders()).map(x => x.orderId), ['order-c', 'order-b', 'order-a']);
});
