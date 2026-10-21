import test from 'node:test';
import assert from 'node:assert/strict';
import { EntitlementService } from '../src/lib/payments/entitlementService';
import { createAnnualPassSettingsRepository } from '../src/lib/payments/annualPassSettingsRepository';
import { annualPassPrice } from '../src/lib/payments/annualPassSettings';
function fixture() {
  const records = new Map<string, any>(); let revision = 0; let fail = false;
  const store = {
    list: async (collection: string) => [...records.entries()].filter(([key]) => key.startsWith(collection + '/')).map(([key, record]) => ({ id: key.split('/')[1], data: structuredClone(record.data), updateTime: record.version })),
    collection: (collection: string) => ({ doc: (id: string) => ({ get: async () => { const old = records.get(collection + '/' + id); return { exists: !!old, updateTime: old?.version }; } }) }),
    commit: async (changes: any[]) => {
      if (fail) throw new Error('storage unavailable');
      for (const change of changes) if (records.get(change.collection + '/' + change.id)?.version !== change.updateTime) throw new Error('concurrent settings conflict');
      for (const change of changes) records.set(change.collection + '/' + change.id, { data: structuredClone(change.data), version: String(++revision) });
    },
  };
  return { fresh: () => { const service = new EntitlementService(); return { service, ...createAnnualPassSettingsRepository(service, () => store as any) }; }, fail: () => { fail = true; } };
}
test('Annual Pass settings persist across new services, including family proposal and disabled sales', async () => {
  const f = fixture(); await f.fresh().save({ regularPrice: 2300, salePrice: 1100, familyPrice: 3400, durationDays: 180, enabled: false }, 'operator');
  const saved = await f.fresh().read(); assert.equal(saved.regularPrice, 2300); assert.equal(saved.familyPrice, 3400); assert.equal(saved.durationDays, 180); assert.equal(saved.enabled, false);
});
test('a failed settings commit does not acknowledge or retain an unsaved price', async () => {
  const f = fixture(); await f.fresh().save({ regularPrice: 2300 }, 'operator'); const current = f.fresh(); await current.read(); f.fail();
  await assert.rejects(current.save({ regularPrice: 9000 }, 'operator'), /storage unavailable/); assert.equal(current.service.getSettings().regularPrice, 2300);
});
test('competing settings saves cannot silently overwrite the same revision', async () => {
  const f = fixture(); await f.fresh().save({ regularPrice: 2300 }, 'operator');
  const results = await Promise.allSettled([f.fresh().save({ regularPrice: 2400 }, 'one'), f.fresh().save({ regularPrice: 2500 }, 'two')]);
  assert.equal(results.filter(row => row.status === 'fulfilled').length, 1);
});
test('membership price obeys enabled flag and inclusive IST promotion dates', () => {
  const settings = new EntitlementService().getSettings(); settings.regularPrice = 2300; settings.salePrice = 1100; settings.promotionalStartDate = '2026-10-21'; settings.promotionalEndDate = '2026-10-21';
  assert.equal(annualPassPrice(settings, 'INR', Date.parse('2026-10-20T18:29:59Z')), 2300);
  assert.equal(annualPassPrice(settings, 'INR', Date.parse('2026-10-20T18:30:00Z')), 1100);
  assert.equal(annualPassPrice(settings, 'INR', Date.parse('2026-10-21T18:30:00Z')), 2300);
  assert.throws(() => annualPassPrice({ ...settings, enabled: false }, 'INR'), /unavailable/);
});
test('membership validation rejects invalid schemas and storage absence fails explicitly', async () => {
  const f = fixture();
  for (const input of [{ regularPrice: NaN }, { durationDays: -1 }, { promotionalStartDate: '2026-02-31' }, { benefits: [{}] }, { unexpected: true }]) await assert.rejects(f.fresh().save(input as any, 'operator'));
  const absent = createAnnualPassSettingsRepository(new EntitlementService(), () => null); await assert.rejects(absent.read(), /Firestore storage/);
});
