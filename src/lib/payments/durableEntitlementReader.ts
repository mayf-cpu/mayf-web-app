/**
 * Read paid entitlements from Firestore rather than Worker-local maps.
 * This is a safe, standalone foundation; premium endpoints must explicitly
 * integrate it before durable payments can unlock downloads.
 */
import type { FirestoreDocumentStore } from '../firebase/documentStore';
import type { Entitlement } from './types';

export type EntitlementCheck = {
  active: boolean;
  entitlement?: Entitlement;
  daysRemaining: number;
  reason?: string;
};

export class DurableEntitlementReader {
  constructor(private readonly store: Pick<FirestoreDocumentStore, 'queryEqual'>) {}

  async checkActiveAnnualPass(userId: string, now = new Date()): Promise<EntitlementCheck> {
    if (!userId?.trim()) return { active: false, daysRemaining: 0, reason: 'User ID missing' };
    const nowMs = now.getTime();
    if (!Number.isFinite(nowMs)) throw new Error('Invalid entitlement check time');

    // Query only records owned by the authenticated student.
    const records = await this.store.queryEqual('paymentEntitlements', 'userId', userId);
    const passes = records.map(doc => doc.data as Entitlement)
      .filter(e => e && e.userId === userId && e.type === 'annual_pass' &&
        e.status === 'active' &&
        Number.isFinite(Date.parse(e.startsAt)) && Number.isFinite(Date.parse(e.expiresAt)) &&
        Date.parse(e.startsAt) <= nowMs && Date.parse(e.expiresAt) > nowMs)
      .sort((a, b) => Date.parse(b.expiresAt) - Date.parse(a.expiresAt));
    const active = passes[0];
    if (!active) return { active: false, daysRemaining: 0, reason: 'No active Annual Pass found for student' };
    return {
      active: true,
      entitlement: active,
      daysRemaining: Math.ceil((Date.parse(active.expiresAt) - nowMs) / 86400000),
    };
  }
}
