/** Durable cross-worker download tokens using Firestore revision preconditions. */
import type { FirestoreDocumentStore } from '../firebase/documentStore';

export type StoredDownloadToken = {
  contentId: string;
  objectKey?: string;
  fileName: string;
  accessType: 'free' | 'paid';
  uid: string | null;
  clientIpHash: string;
  expiresAt: number;
  used: boolean;
};
const COLLECTION = 'downloadAuthorizations';
function tokenId(token: string): string {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error('Invalid download token');
  return token;
}
export class DurableDownloadTokens {
  constructor(private readonly store: Pick<FirestoreDocumentStore, 'collection' | 'commit'>) {}

  async create(token: string, data: Omit<StoredDownloadToken, 'used'>): Promise<void> {
    const id = tokenId(token);
    if (!Number.isFinite(data.expiresAt) || data.expiresAt <= Date.now() ||
        data.expiresAt > Date.now() + 120000 ||
        !data.contentId || !data.clientIpHash) throw new Error('Invalid authorization');
    await this.store.commit([{ collection: COLLECTION, id, data: { ...data, used: false } }]);
  }

  /** Returns null for expired, consumed, or invalid records. */
  async peek(token: string, now = Date.now()): Promise<StoredDownloadToken | null> {
    const doc = await this.store.collection(COLLECTION).doc(tokenId(token)).get();
    const record = doc.data() as StoredDownloadToken | undefined;
    if (!doc.exists || !record || record.used || !Number.isFinite(record.expiresAt) ||
        record.expiresAt <= now) return null;
    return record;
  }

  /**
   * Atomically consume the token. Only one parallel commit may succeed.
   * The caller should verify PDF bytes BEFORE consuming.
   */
  async consume(token: string, expected: StoredDownloadToken, now = Date.now()): Promise<void> {
    const id = tokenId(token);
    const doc = await this.store.collection(COLLECTION).doc(id).get();
    if (!doc.exists || !doc.updateTime) throw new Error('Download authorization missing');
    const data = doc.data() as StoredDownloadToken;
    if (data.used || data.expiresAt <= now ||
        data.contentId !== expected.contentId ||
        data.clientIpHash !== expected.clientIpHash ||
        data.uid !== expected.uid) {
      throw new Error('Download authorization expired, used, or changed');
    }
    await this.store.commit([{
      collection: COLLECTION, id, updateTime: doc.updateTime,
      data: { ...data, used: true },
    }]);
  }
}
