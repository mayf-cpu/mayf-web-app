/**
 * Temporary checkout policy: sell one server-priced Annual Pass only.
 * Catalogue purchases require a proper product/pricing lookup before launch.
 */
export function validateAnnualPassCart(items: unknown): boolean {
  if (!Array.isArray(items) || items.length > 1) return false;
  if (items.length === 0) return true;
  const item = items[0];
  return !!item && typeof item === 'object' && item.annualPass === true &&
    Number(item.quantity ?? 1) === 1;
}

/**
 * Interim production launch is INR/Razorpay only. Stripe implementation is
 * preserved but remains unavailable until sandbox checkout acceptance.
 * Never let an "auto" selection route INR orders to saved Stripe settings.
 */
export function isSupportedLaunchPaymentMethod(currency: unknown, provider: unknown): boolean {
  return typeof currency === 'string' && currency.toUpperCase() === 'INR' &&
    (provider === undefined || provider === null || provider === 'auto' || provider === 'razorpay');
}

/** Enforce the deferred-Stripe release policy for internal service callers too. */
export function assertReleaseCheckout(provider: unknown, currency: unknown): void {
  if (!isSupportedLaunchPaymentMethod(currency, provider)) throw new Error('Only Razorpay checkout in INR is currently available.');
}
