/** Persist download authorization and file access audits in Firestore. */
import type { FirestoreDocumentStore } from '../firebase/documentStore';
export type DownloadAuditEntry = {
  id: string; contentId: string; timestamp: string; uid: string | null;
  accessType: 'free' | 'paid'; status: 'successful' | 'failed';
  action: 'authorize' | 'file_served'; reason?: string;
  securityMeta: { ipHash: string; userAgent?: string };
};
const COLLECTION = 'downloadAuditLogs';
export class DurableDownloadAudit {
  constructor(private readonly store: Pick<FirestoreDocumentStore, 'commit' | 'list'>) {}
  async record(entry: DownloadAuditEntry): Promise<void> {
    if (!/^[a-zA-Z0-9_-]{8,160}$/.test(entry.id) ||
      !entry.contentId || !Number.isFinite(Date.parse(entry.timestamp))) {
      throw new Error('Invalid download audit entry');
    }
    await this.store.commit([{ collection: COLLECTION, id: entry.id, data: { ...entry } }]);
  }
  async recent(limit = 500): Promise<DownloadAuditEntry[]> {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 500) throw new Error('Invalid audit limit');
    const docs = await this.store.list(COLLECTION);
    return docs.map(d => d.data as DownloadAuditEntry)
      .filter(d => d && typeof d.timestamp === 'string' && Number.isFinite(Date.parse(d.timestamp)))
      .sort((a,b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)).slice(0, limit);
  }
}
