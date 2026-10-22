import test from 'node:test';
import assert from 'node:assert/strict';
import { CouponService } from '../src/lib/coupons/couponService';
import { DocumentStateRepository } from '../src/lib/firebase/documentStateRepository';

function fixture() {
  const docs = new Map<string, any>();
  let version = 0;
  let rejectWrites = false;
  const store = {
    collection: (collection: string) => ({ doc: (id: string) => ({ get: async () => ({ exists: docs.has(`${collection}/${id}`), updateTime: docs.get(`${collection}/${id}`)?.updateTime }) }) }),
    list: async (collection: string) => structuredClone([...docs.entries()].filter(([key]) => key.startsWith(`${collection}/`)).map(([, value]) => value)),
    commit: async (changes: any[]) => {
      if (rejectWrites) throw new Error('Firestore denied write');
      for (const change of changes) assert.equal(change.updateTime, docs.get(`${change.collection}/${change.id}`)?.updateTime);
      for (const change of changes) {
        const key = `${change.collection}/${change.id}`;
        if (change.data) docs.set(key, { id: change.id, data: structuredClone(change.data), updateTime: String(++version) });
        else docs.delete(key);
      }
    },
  };
  const fresh = () => {
    const service = new CouponService();
    service.couponState.importState([]);
    service.promotionState.importState([]);
    const repository = new DocumentStateRepository([{ collection: 'coupons', state: service.couponState }, { collection: 'promotions', state: service.promotionState }], () => store as any, 'couponState');
    return { service, repository };
  };
  return { fresh, reject: () => { rejectWrites = true; } };
}

test('coupon and promotion edits survive a fresh instance and deleted offers stay deleted', async () => {
  const { fresh } = fixture();
  let { service, repository } = fresh();
  await repository.run(() => { service.saveCoupon({ code: 'QA20', discountValue: 20 }); service.savePromotion({ id: 'qa-promo', title: 'QA promotion' }); }, true);
  ({ service, repository } = fresh());
  await repository.run(() => { assert.equal(service.getCoupon('qa20')?.discountValue, 20); assert.equal(service.getAllPromotions()[0].title, 'QA promotion'); });
  await repository.run(() => { service.saveCoupon({ code: 'QA20', discountValue: 30 }); service.deletePromotion('qa-promo'); }, true);
  ({ service, repository } = fresh());
  await repository.run(() => { assert.equal(service.getCoupon('qa20')?.discountValue, 30); assert.deepEqual(service.getAllPromotions(), []); });
  await repository.run(() => service.deleteCoupon('QA20'), true);
  ({ service, repository } = fresh());
  assert.deepEqual(await repository.run(() => service.getAllCoupons()), []);
});
test('failed coupon commits reject and restore the previous committed discount', async () => {
  const fixtureState = fixture();
  const { service, repository } = fixtureState.fresh();
  await repository.run(() => service.saveCoupon({ code: 'QA20', discountValue: 20 }), true);
  fixtureState.reject();
  await assert.rejects(repository.run(() => service.saveCoupon({ code: 'QA20', discountValue: 80 }), true), /denied/);
  assert.equal(service.getCoupon('QA20')?.discountValue, 20);
});
test('coupon redemption totals survive restart and admin edits cannot invent usage', async () => {
  const { fresh } = fixture();
  let { service, repository } = fresh();
  await repository.run(() => { service.saveCoupon({ code: 'QA20', discountValue: 20, timesUsed: 400 }); service.recordCouponRedemption('QA20', 'student'); }, true);
  ({ service, repository } = fresh());
  await repository.run(() => { assert.equal(service.getCoupon('QA20')?.timesUsed, 1); assert.equal(service.getCoupon('QA20')?.userUsageMap.student, 1); });
});
test('coupon validation rejects empty product scopes and currency-mismatched discounts', () => {
  const service = new CouponService();
  service.saveCoupon({ code: 'SELECTED', discountValue: 20, scope: 'selected_products', selectedProductIds: ['resource'] });
  service.saveCoupon({ code: 'PASS', discountValue: 20, scope: 'annual_pass_only' });
  const validate = (code: string, items: any[], currency = 'INR') => service.validateCoupon({ code, items, currency, cartGrossAmount: 999 });
  assert.equal(validate('SELECTED', []).valid, false);
  assert.equal(validate('PASS', [{ id: 'something-pass', title: 'Annual Pass', unitPrice: 999 }]).valid, false);
  assert.equal(validate('PASS', [{ annualPass: true, unitPrice: 999 }], 'USD').valid, false);
  assert.equal(validate('PASS', [{ annualPass: true, unitPrice: 999 }]).discountAmount, 20);
});
test('malformed coupon and promotion settings cannot be saved', () => {
  const service = new CouponService();
  for (const patch of [{ code: '../path' }, { discountValue: -1 }, { discountValue: NaN }, { discountType: 'percentage' as const, discountValue: 101 }, { usageLimit: 1.5 }, { startDate: 'invalid' }, { scope: 'selected_products' as const, selectedProductIds: [] }]) assert.throws(() => service.saveCoupon({ code: 'QA', ...patch }));
  assert.throws(() => service.savePromotion({ ctaLink: 'javascript:alert(1)' }));
  assert.throws(() => service.savePromotion({ targetPlacements: [] }));
});
test('production starts without invented coupons or published promotions', () => {
  const before = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try { const service = new CouponService(); assert.deepEqual(service.getAllCoupons(), []); assert.deepEqual(service.getAllPromotions(), []); }
  finally { if (before === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = before; }
});

 test('promotion edits can clear an associated coupon instead of retaining it', () => {
  const service = new CouponService();
  const promo = service.savePromotion({ id: 'qa-clear', couponCode: 'OLD' });
  assert.equal(service.savePromotion({ id: promo.id, couponCode: '' }).couponCode, '');
});
