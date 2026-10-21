import crypto from 'node:crypto';
import type { FirestoreDocumentStore } from '../firebase/documentStore';

/** Daily request quota in IST, conditional writes prevent competing isolates overspending it. */
export class AiQuota {
  constructor(private getStore: () => FirestoreDocumentStore | null) {}
  async consume(identity: string, limit: number, now = Date.now()) {
    const db = this.getStore();
    if (!db) throw new Error('AI quota storage is not configured.');
    const day = new Date(now + 330 * 60000).toISOString().slice(0, 10);
    const id = `${day}-${crypto.createHash('sha256').update(identity).digest('hex')}`;
    const doc = db.collection('aiDailyQuotas').doc(id);
    for (let attempt = 0; attempt < 4; attempt++) {
      const snapshot = await doc.get();
      const count = Number(snapshot.data()?.count || 0);
      if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid AI quota record.');
      if (count >= limit) return { allowed: false, remaining: 0 };
      try {
        await doc.set({ count: count + 1, day, expiresAt: new Date(now + 3 * 86400000).toISOString() }, snapshot.exists ? { updateTime: snapshot.updateTime } : { exists: false });
        return { allowed: true, remaining: limit - count - 1 };
      } catch (error: any) {
        if (!/409|412|concurrent|conflict/i.test(error.message)) throw error;
      }
    }
    throw new Error('AI quota changed concurrently. Retry shortly.');
  }
}
