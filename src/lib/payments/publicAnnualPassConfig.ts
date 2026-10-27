import type {AnnualPassSettings} from './types';

export interface PublicAnnualPassConfig {
  settings: AnnualPassSettings;
  effectivePriceINR: number;
  taxRatePercentage: number;
  checkoutEnabled: boolean;
}

export async function fetchPublicAnnualPassConfig({request = fetch, signal, timeoutMs = 12000}: {request?: typeof fetch; signal?: AbortSignal; timeoutMs?: number} = {}): Promise<PublicAnnualPassConfig> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, {once: true});
  if (signal?.aborted) abort();
  const timeout = setTimeout(abort, timeoutMs);
  try {
    const response = await request('/api/annual-pass/config', {credentials: 'omit', headers: {Accept: 'application/json'}, signal: controller.signal});
    const data = await response.json();
    const settings = data?.settings;
    if (!response.ok || data.success !== true || !settings || typeof settings.enabled !== 'boolean' ||
        typeof settings.name !== 'string' || !settings.name.trim() || settings.currency !== 'INR' ||
        !Number.isInteger(settings.durationDays) || settings.durationDays < 1 ||
        !Array.isArray(settings.benefits) || settings.benefits.some((value: unknown) => typeof value !== 'string') ||
        !Number.isFinite(settings.regularPrice) || settings.regularPrice <= 0 ||
        !Number.isFinite(data.effectivePriceINR) || data.effectivePriceINR <= 0 ||
        !Number.isFinite(data.taxRatePercentage) || data.taxRatePercentage < 0 || data.taxRatePercentage > 100 ||
        typeof data.checkoutEnabled !== 'boolean') throw new Error('Invalid pricing response');
    return {settings, effectivePriceINR: data.effectivePriceINR, taxRatePercentage: data.taxRatePercentage, checkoutEnabled: data.checkoutEnabled};
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error('Membership pricing could not be loaded. Please retry.');
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}
