/** Cross-worker download throttling with optimistic Firestore concurrency. */
import crypto from 'node:crypto';
import type { FirestoreDocumentStore } from '../firebase/documentStore';

const COLLECTION = 'downloadRateLimits';
type Store = Pick<FirestoreDocumentStore, 'collection' | 'commit'>;
export class DurableDownloadLimiter {
  constructor(private readonly store: Store) {}
  async isLimited(key: string, limit: number, windowMs: number, now = Date.now()): Promise<boolean> {
    if (!key || !Number.isSafeInteger(limit) || limit < 1 ||
      !Number.isSafeInteger(windowMs) || windowMs < 1) throw new Error('Invalid download rate limit');
    const id = crypto.createHash('sha256').update(key).digest('hex');
    for (let attempt = 0; attempt < 5; attempt++) {
      const doc = await this.store.collection(COLLECTION).doc(id).get();
      const state = doc.exists ? doc.data() : undefined;
      const raw = Array.isArray(state?.timestamps) ? state.timestamps : [];
      const timestamps = raw.filter((n: unknown): n is number =>
        typeof n === 'number' && Number.isFinite(n) && n <= now && n > now - windowMs);
      if (timestamps.length >= limit) return true;
      try {
        await this.store.commit([{
          collection: COLLECTION, id, ...(doc.updateTime ? { updateTime: doc.updateTime } : {}),
          data: { timestamps: [...timestamps, now], updatedAt: new Date(now).toISOString() },
        }]);
        return false;
      } catch (error) {
        // Firestore commits use an exact revision (or exists:false); retry a
        // competing update. Never turn a database error into unlimited access.
        if (attempt === 4) throw error;
      }
    }
    throw new Error('Unable to enforce download rate limit');
  }
}
