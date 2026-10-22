import type { TokenVerificationResult } from '../firebase/admin';
import type { PaymentService } from './paymentService';
import type { EntitlementService } from './entitlementService';

/** Call inside a fresh commerce repository read; revoked/refunded purchases grant nothing. */
export function hasPurchasedContentAccess(verified: TokenVerificationResult | null, item: { id: string; annualPassIncluded?: boolean }, payments: PaymentService, entitlements: EntitlementService): boolean {
  if (!verified?.valid || !verified.uid) return false;
  if (verified.admin || verified.superAdmin || verified.pro) return true;
  if (item.annualPassIncluded && entitlements.checkActiveEntitlement(verified.uid).active) return true;
  return payments.getUserOrders(verified.uid).some(order => order.status === 'paid' && order.items.some(line => line.contentItemId === item.id && !line.annualPass));
}
