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
  constructor(private readonly store: Pick<FirestoreDocumentStore, 'queryEqual' | 'collection'>) {}

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

    // A refund may roll back a renewal cursor while older immutable pass
    // documents retain the original, longer expiry. Never grant beyond the
    // authoritative per-student cursor when one exists.
    const cursorDoc = await this.store.collection('paymentRenewalCursors').doc(userId).get();
    let effectiveExpiry = Date.parse(active.expiresAt);
    if (cursorDoc.exists) {
      const cursor = cursorDoc.data();
      const cursorExpiry = typeof cursor?.expiresAt === 'string' ? Date.parse(cursor.expiresAt) : NaN;
      if (cursor?.userId !== userId || !Number.isFinite(cursorExpiry)) {
        throw new Error('Annual Pass renewal cursor is invalid');
      }
      effectiveExpiry = Math.min(effectiveExpiry, cursorExpiry);
    }
    if (effectiveExpiry <= nowMs) {
      return { active: false, daysRemaining: 0, reason: 'Annual Pass has expired or been refunded' };
    }
    return {
      active: true,
      entitlement: { ...active, expiresAt: new Date(effectiveExpiry).toISOString() },
      daysRemaining: Math.ceil((effectiveExpiry - nowMs) / 86400000),
    };
  }
}
