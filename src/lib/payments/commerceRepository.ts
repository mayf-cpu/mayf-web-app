import { DocumentStateRepository } from '../firebase/documentStateRepository';
import { getAdminFirestore } from '../firebase/admin';
import { PaymentService, paymentService } from './paymentService';
import { EntitlementService, entitlementService } from './entitlementService';
import { CouponService, couponService } from '../coupons/couponService';
import type { FirestoreDocumentStore } from '../firebase/documentStore';

/** One conditional atomic commit covers order, webhook, coupon and entitlement changes. */
export function createCommerceRepository(payments: PaymentService, entitlements: EntitlementService, coupons: CouponService, getStore: () => FirestoreDocumentStore | null) {
  return new DocumentStateRepository([
    { collection: 'orders', state: payments.orderState },
    { collection: 'paymentWebhookEvents', state: payments.webhookState },
    // These server-only collections are denied by the client rules' default deny.
    { collection: 'paymentRuntimeSettings', state: payments.settingsState },
    { collection: 'entitlements', state: entitlements.entitlementState },
    { collection: 'entitlementHistory', state: entitlements.historyState },
    { collection: 'annualPassSettings', state: entitlements.settingsState },
    { collection: 'coupons', state: coupons.couponState },
    { collection: 'promotions', state: coupons.promotionState },
  ], getStore, 'commerceState');
}
export const commerceRepository = createCommerceRepository(paymentService, entitlementService, couponService, getAdminFirestore);
