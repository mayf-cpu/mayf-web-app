import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { CouponService } from '../src/lib/coupons/couponService';

const read=(path: string)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('coupon and promotion state can be exported and rehydrated', () => {
  const service = new CouponService();
  const coupons = service.couponState.exportState();
  const promotions = service.promotionState.exportState();
  service.couponState.importState([]);
  service.promotionState.importState([]);
  assert.equal(service.getAllCoupons().length,0);
  assert.equal(service.getAllPromotions().length,0);
  service.couponState.importState(coupons);
  service.promotionState.importState(promotions);
  assert.deepEqual(service.couponState.exportState(),coupons);
  assert.deepEqual(service.promotionState.exportState(),promotions);
});

test('production coupon seeds are disabled and offer writes share an audit commit', () => {
  const svc=read('src/lib/coupons/couponService.ts');
  assert.match(svc,/if \(!isProductionPaymentRuntime\(\)\)/);
  const repo=read('src/lib/cms/catalogueRepository.ts');
  assert.match(repo,/collection: 'coupons', state: couponService\.couponState/);
  assert.match(repo,/collection: 'promotions', state: couponService\.promotionState/);
  assert.match(repo,/collection: 'adminAuditLogs', state: auditLogService/);
  const server=read('server.ts');
  for (const route of ['coupons','promotions']) {
    assert.match(server,new RegExp("app\\.post\\('/api/admin/"+route+"'.*requirePersistentOffers, catalogueRoute\\(true"));
  }
  assert.match(server,/\['\/api\/payments\/create-order'\], \(\) => catalogueRepository\.run/);
  assert.match(server,/if \(!getAdminFirestore\(\)\) return res\.status\(503\)/);
});

test('offers admin UI never uses fabricated credentials', () => {
  const section = read('src/components/admin/sections/AdminCouponsSection.tsx');
  assert.doesNotMatch(section, /dev-admin-token/);
  const helper = read('src/lib/firebase/adminRequestHeaders.ts');
  assert.match(helper, /auth\.authStateReady\(\)/);
  assert.match(helper, /currentUser\.getIdToken\(\)|user\.getIdToken\(\)/);
  for (const component of ['CouponsManagementTab', 'PromotionsManagementTab']) {
    const source = read('src/components/admin/' + component + '.tsx');
    assert.match(source, /await getAdminRequestHeaders\(\)/);
  }
});
