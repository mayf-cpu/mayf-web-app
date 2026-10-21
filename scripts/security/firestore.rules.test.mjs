import test, { before, after, beforeEach } from 'node:test';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
let env;
before(async () => {
  if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8089') throw new Error('Run with the configured local Firestore emulator only.');
  env = await initializeTestEnvironment({ projectId: 'demo-mayf-rules', firestore: { host: '127.0.0.1', port: 8089, rules: await readFile('firestore.rules', 'utf8') } });
});
after(async () => { if (env) await env.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, 'contentItems/public'), { visible: true, status: 'published', price: 0, file: 'https://private-assets.test/file.pdf' }),
      setDoc(doc(db, 'orders/one'), { userId: 'one', status: 'paid', grossAmount: 99 }),
      setDoc(doc(db, 'orders/two'), { userId: 'two', status: 'paid' }),
      setDoc(doc(db, 'aiTeacherSessions/answer'), { userId: 'one', responseStatus: 'success', latencyMs: 100 }),
      setDoc(doc(db, 'notifications/notice'), { userId: 'one', read: false, title: 'Notice' }),
    ]);
  });
});
const db = uid => env.authenticatedContext(uid, { email: `${uid}@example.test` }).firestore();
const profile = uid => ({ uid, displayName: 'Student', email: `${uid}@example.test`, studentClass: 'Class 10', board: 'CBSE', createdAt: new Date().toISOString() });
test('raw published attachments are private to authenticated administrators', async () => {
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'contentItems/public')));
  await assertFails(getDoc(doc(db('one'), 'contentItems/public')));
  const admin = env.authenticatedContext('operator', { admin: true }).firestore();
  await assertSucceeds(getDoc(doc(admin, 'contentItems/public')));
  await assertFails(updateDoc(doc(admin, 'contentItems/public'), { file: 'https://attacker.test' }));
});
test('even administrator browser tokens cannot bypass server financial invariants', async () => {
  for (const user of [db('one'), env.authenticatedContext('operator', { superAdmin: true }).firestore()]) {
    for (const path of ['paymentRefundRequests/fake', 'paymentOrders/fake', 'paymentEntitlements/fake', 'paymentCouponReservations/fake', 'paymentCouponRedemptions/fake', 'orders/fake', 'payments/fake', 'entitlements/fake', 'annualPasses/fake', 'coupons/fake', 'paymentRuntimeSettings/gateway', 'commerceState/initialized', 'auditLogs/fake', 'downloadTickets/fake', 'analyticsDaily/fake']) {
      await assertFails(setDoc(doc(user, path), { userId: 'one', status: 'paid' }));
    }
  }
});
test('order reads and owner-filtered queries cannot expose another account', async () => {
  await assertSucceeds(getDoc(doc(db('one'), 'orders/one')));
  await assertFails(getDoc(doc(db('one'), 'orders/two')));
  await assertFails(getDocs(collection(db('one'), 'orders')));
  await assertSucceeds(getDocs(query(collection(db('one'), 'orders'), where('userId', '==', 'one'))));
});
test('AI sessions cannot be forged or rewritten by their owner', async () => {
  await assertSucceeds(getDoc(doc(db('one'), 'aiTeacherSessions/answer')));
  await assertFails(getDoc(doc(db('two'), 'aiTeacherSessions/answer')));
  await assertFails(setDoc(doc(db('one'), 'aiTeacherSessions/fake'), { userId: 'one', responseStatus: 'success' }));
  await assertFails(updateDoc(doc(db('one'), 'aiTeacherSessions/answer'), { latencyMs: 1, userRating: 'helpful' }));
});
test('profiles reject escalation, unknown fields, ownership changes and invalid types', async () => {
  const user = db('one');
  await assertFails(setDoc(doc(user, 'users/one'), { ...profile('one'), superAdmin: true }));
  await assertFails(setDoc(doc(user, 'users/one'), { ...profile('one'), pro: true }));
  await assertSucceeds(setDoc(doc(user, 'users/one'), profile('one')));
  await assertSucceeds(updateDoc(doc(user, 'users/one'), { studentClass: 'Class 9', board: 'State Board' }));
  for (const patch of [{ role: 'admin' }, { uid: 'two' }, { displayName: {} }, { displayName: 'x'.repeat(121) }, { email: 'other@example.test' }]) await assertFails(updateDoc(doc(user, 'users/one'), patch));
  await assertFails(setDoc(doc(user, 'users/two'), profile('two')));
});
test('activity accepts bounded reported events and denies nested payload abuse or ownership edits', async () => {
  const user = db('one'); const value = { id: 'activity', userId: 'one', eventType: 'formula_view', title: 'Viewed formula', createdAt: new Date().toISOString(), metadata: { category: 'Algebra', classLevel: 'Class 10' } };
  await assertSucceeds(setDoc(doc(user, 'activityLogs/activity'), value));
  await assertFails(updateDoc(doc(user, 'activityLogs/activity'), { userId: 'two' }));
  await assertFails(setDoc(doc(user, 'activityLogs/bad'), { ...value, id: 'bad', metadata: { category: { nested: 'x'.repeat(5000) } } }));
  await assertFails(setDoc(doc(user, 'activityLogs/bad'), { ...value, id: 'bad', title: 'x'.repeat(501) }));
  await assertFails(getDoc(doc(db('two'), 'activityLogs/activity')));
  await assertSucceeds(deleteDoc(doc(user, 'activityLogs/activity')));
});
test('notifications allow only a boolean read marker for their owner', async () => {
  await assertSucceeds(updateDoc(doc(db('one'), 'notifications/notice'), { read: true }));
  await assertFails(updateDoc(doc(db('one'), 'notifications/notice'), { read: 'yes' }));
  await assertFails(updateDoc(doc(db('one'), 'notifications/notice'), { title: 'Replacement' }));
  await assertFails(updateDoc(doc(db('two'), 'notifications/notice'), { read: true }));
});
test('saved items enforce owner and bounded schema while unknown server collections deny reads', async () => {
  const user = db('one'); const item = { id: 'saved', userId: 'one', contentItemId: 'formula', itemType: 'formula', title: 'Formula', slug: 'formula', createdAt: new Date().toISOString() };
  await assertSucceeds(setDoc(doc(user, 'savedItems/saved'), item));
  await assertFails(updateDoc(doc(user, 'savedItems/saved'), { userId: 'two' }));
  await assertFails(getDoc(doc(db('two'), 'savedItems/saved')));
  await assertFails(setDoc(doc(user, 'savedItems/large'), { ...item, id: 'large', title: 'x'.repeat(201) }));
  for (const path of ['paymentRefundRequests/private', 'paymentRuntimeSettings/gateway', 'downloadTickets/token', 'auditLogs/private', 'ingestionConnections/registry', 'aiDailyQuotas/private']) await assertFails(getDoc(doc(user, path)));
});
