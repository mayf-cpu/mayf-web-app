import type { AnnualPassSettings, PaymentOrderItem } from './types';

type Product = { id: string; title: string; description?: string; price?: number; accessType: string; visible: boolean; status: string; isDeleted?: boolean };
const passIds = new Set(['item-annual-pass', 'annual-pass']);

/** Rebuild the cart from server records; request prices and entitlement flags are ignored. */
export function resolveCheckoutCart(input: unknown, currency: unknown, pass: AnnualPassSettings, getProduct: (id: string) => Product | null, now = Date.now()) {
  if (typeof currency !== 'string' || !['INR', 'USD'].includes(currency.toUpperCase())) throw new Error('Unsupported checkout currency.');
  const normalizedCurrency = currency.toUpperCase();
  if (!Array.isArray(input) || input.length > 20) throw new Error('Invalid checkout items.');
  const requested = input.length ? input : [{ id: 'item-annual-pass' }];
  const seen = new Set<string>();
  const items: PaymentOrderItem[] = requested.map(raw => {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid checkout item.');
    const id = raw.contentItemId || raw.id;
    if (typeof id !== 'string' || !id || seen.has(id)) throw new Error('Unknown or duplicate checkout item.');
    seen.add(id);
    // Digital access is purchased once. Fractional, negative and bulk quantities are invalid.
    if (raw.quantity !== undefined && raw.quantity !== 1) throw new Error('Digital products require quantity 1.');
    if (passIds.has(id)) {
      if (!pass.enabled) throw new Error('Annual Pass purchases are currently unavailable.');
      const promotionActive = (!pass.promotionalStartDate || now >= Date.parse(pass.promotionalStartDate)) &&
        (!pass.promotionalEndDate || now < Date.parse(pass.promotionalEndDate) + 86400000);
      const price = normalizedCurrency === 'USD' ? 29 : (promotionActive ? pass.salePrice : pass.regularPrice);
      if (!Number.isFinite(price) || price <= 0) throw new Error('Annual Pass price is not configured.');
      return { id: 'item-annual-pass', title: pass.name, description: pass.description, unitPrice: price, quantity: 1, annualPass: true };
    }
    const product = getProduct(id);
    if (!product || product.isDeleted || !product.visible || product.status !== 'published' || product.accessType === 'free') throw new Error('This resource is not available for purchase.');
    if (normalizedCurrency !== 'INR') throw new Error('Individual resources are priced in INR.');
    if (!Number.isFinite(product.price) || product.price! <= 0) throw new Error('Resource price is not configured.');
    return { id: product.id, contentItemId: product.id, title: product.title, description: product.description, unitPrice: product.price!, quantity: 1, annualPass: false };
  });
  // The aliases refer to the same pass and must not create two entitlements in one cart.
  if (items.filter(item => item.annualPass).length > 1) throw new Error('Only one Annual Pass may be purchased at a time.');
  return { items, grossAmount: Math.round(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) * 100) / 100, currency: normalizedCurrency };
}
