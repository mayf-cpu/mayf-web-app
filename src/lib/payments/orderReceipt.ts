import type { StoredOrder } from './types';
/** Downloadable payment record. Merchant tax-invoice details must never be invented. */
export function orderReceipt(order: StoredOrder, uid: string): string {
  if (!uid || order.userId !== uid || !['paid', 'refunded'].includes(order.status) ||
      !order.providerPaymentId || !Number.isFinite(Date.parse(order.paidAt || ''))) {
    throw new Error('A verified payment belonging to this account is required for a receipt.');
  }
  const amounts = [order.grossAmount, order.discount, order.tax ?? 0];
  if (!amounts.every(value => Number.isFinite(value) && value >= 0) || order.discount > order.grossAmount ||
      !/^[A-Z]{3}$/.test(order.currency)) throw new Error('Order amounts or currency are invalid.');
  const format = (value: number) => `${order.currency} ${value.toFixed(2)}`;
  return ['Maths at Your Fingertips — Payment receipt', 'https://mayf.co.in',
    `Order: ${order.orderId}`, `Payment: ${order.providerPaymentId}`, `Provider: ${order.provider}`,
    `Paid at: ${new Date(order.paidAt!).toISOString()}`, `Current order status: ${order.status}`,
    `Items: ${order.items.map(item => item.title).join(', ')}`, `Gross amount: ${format(order.grossAmount)}`,
    `Discount${order.coupon ? ` (${order.coupon})` : ''}: ${format(order.discount)}`,
    `Tax recorded: ${format(order.tax ?? 0)}`,
    `Total payment: ${format(order.grossAmount - order.discount + (order.tax ?? 0))}`, ''].join('\n');
}
