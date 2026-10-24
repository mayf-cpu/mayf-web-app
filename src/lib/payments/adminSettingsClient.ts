import type { MaskedPaymentGatewaySettings, PaymentGatewaySettings } from './types';

export async function verifyRazorpayTestConnection(headers: HeadersInit, fetcher: typeof fetch = fetch): Promise<void> {
  const response = await fetcher('/api/admin/payments/settings/check', { method: 'POST', headers });
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.success !== true || data.verified !== true || data.mode !== 'test') {
    throw new Error(data?.error || 'Razorpay test connection could not be verified.');
  }
}

export function gatewaySettingsUpdate(input: Partial<PaymentGatewaySettings>): Partial<PaymentGatewaySettings> {
  const result = { ...input };
  for (const field of ['razorpayKeySecret', 'razorpayWebhookSecret', 'stripeSecretKey', 'stripeWebhookSecret'] as const) {
    const value = result[field]?.trim();
    if (!value || value.includes('••••')) delete result[field];
    else result[field] = value;
  }
  return result;
}

export async function requestGatewaySettings(headers: HeadersInit, update?: Partial<PaymentGatewaySettings>, fetcher: typeof fetch = fetch): Promise<MaskedPaymentGatewaySettings> {
  const response = await fetcher('/api/admin/payments/settings', {
    method: update ? 'POST' : 'GET',
    headers,
    ...(update ? { body: JSON.stringify(gatewaySettingsUpdate(update)) } : {}),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.success !== true || !data.settings) {
    throw new Error(update ? 'Payment settings were not saved. Please retry.' : 'Payment settings could not be loaded. Please retry.');
  }
  return data.settings;
}
