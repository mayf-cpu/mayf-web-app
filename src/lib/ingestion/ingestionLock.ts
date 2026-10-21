import crypto from 'node:crypto';
import type { FirestoreDocumentStore } from '../firebase/documentStore';

type LockStore = Pick<FirestoreDocumentStore, 'collection' | 'commit'>;
const COLLECTION = 'importLocks';
const LEASE_MS = 180_000;

export class IngestionLock {
  constructor(private readonly store: LockStore) {}
  async acquire(contentId: string, now = Date.now()): Promise<{ release: () => Promise<void> }> {
    if (!contentId?.trim()) throw new Error('Import content ID required');
    const id = crypto.createHash('sha256').update(contentId.trim()).digest('hex');
    const owner = crypto.randomBytes(24).toString('hex');
    const ref = this.store.collection(COLLECTION).doc(id);
    const current = await ref.get();
    const previous = current.exists ? current.data() : undefined;
    if (current.exists && (!previous || !Number.isFinite(previous.expiresAt) || previous.expiresAt > now)) {
      throw new Error('This content is already being imported. Try again after the current import finishes.');
    }
    if (current.exists && !current.updateTime) throw new Error('Import lock revision unavailable');
    await this.store.commit([{
      collection: COLLECTION, id, data: { contentId: contentId.trim(), owner, expiresAt: now + LEASE_MS },
      ...(current.updateTime ? { updateTime: current.updateTime } : {}),
    }]);
    return {
      release: async () => {
        const latest = await ref.get();
        if (!latest.exists || latest.data()?.owner !== owner) return;
        if (!latest.updateTime) throw new Error('Import lock revision unavailable');
        await this.store.commit([{ collection: COLLECTION, id, updateTime: latest.updateTime }]);
      },
    };
  }
}
