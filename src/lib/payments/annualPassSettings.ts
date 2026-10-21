import type { AnnualPassSettings } from './types';
export function validateAnnualPassSettings(input: AnnualPassSettings): AnnualPassSettings {
  const keys = ['enabled', 'name', 'regularPrice', 'salePrice', 'familyPrice', 'currency', 'durationDays', 'description', 'benefits', 'eligibleContent', 'promotionalStartDate', 'promotionalEndDate', 'updatedAt', 'updatedBy'];
  if (Object.keys(input).some(key => !keys.includes(key))) throw new Error('Unknown Annual Pass setting.');
  if (typeof input.enabled !== 'boolean' || input.currency !== 'INR') throw new Error('Invalid membership availability or base currency.');
  if (!Number.isFinite(input.regularPrice) || input.regularPrice <= 0 || input.regularPrice > 1000000 || !Number.isFinite(input.salePrice) || input.salePrice < 0 || input.salePrice > 1000000 || input.familyPrice !== undefined && (!Number.isFinite(input.familyPrice) || input.familyPrice <= 0 || input.familyPrice > 1000000)) throw new Error('Invalid membership price.');
  if (!Number.isInteger(input.durationDays) || input.durationDays < 1 || input.durationDays > 3650) throw new Error('Pass duration must be 1–3650 whole days.');
  if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 200 || typeof input.description !== 'string' || input.description.length > 3000) throw new Error('Invalid membership text.');
  for (const value of [input.benefits, input.eligibleContent]) if (!Array.isArray(value) || value.length > 100 || value.some(text => typeof text !== 'string' || text.length > 500)) throw new Error('Invalid membership benefits or eligible content.');
  for (const value of [input.promotionalStartDate, input.promotionalEndDate]) if (value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) throw new Error('Promotion dates must be valid calendar dates.');
  if (input.promotionalStartDate && input.promotionalEndDate && input.promotionalStartDate > input.promotionalEndDate) throw new Error('Promotion end date must follow its start date.');
  return structuredClone(input);
}
export function annualPassPrice(settings: AnnualPassSettings, currency: string, now = Date.now()) {
  if (!settings.enabled) throw new Error('Annual Pass purchases are currently unavailable.');
  if (!['INR', 'USD'].includes(currency.toUpperCase())) throw new Error('Unsupported checkout currency.');
  if (currency.toUpperCase() === 'USD') return 29;
  const start = settings.promotionalStartDate ? Date.parse(settings.promotionalStartDate + 'T00:00:00+05:30') : -Infinity;
  const end = settings.promotionalEndDate ? Date.parse(settings.promotionalEndDate + 'T00:00:00+05:30') + 86400000 : Infinity;
  return settings.salePrice > 0 && now >= start && now < end ? settings.salePrice : settings.regularPrice;
}
