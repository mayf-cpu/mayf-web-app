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
