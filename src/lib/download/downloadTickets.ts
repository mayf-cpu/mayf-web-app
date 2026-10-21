import crypto from 'node:crypto';
import type { FirestoreDocumentStore } from '../firebase/documentStore';

export interface DownloadTicket { contentId: string; fileName: string; mimeType: string; accessType: 'free' | 'paid'; uid: string | null; clientIpHash: string; createdAt: number; expiresAt: number; used: boolean }
export class DownloadTickets {
  constructor(private getStore: () => FirestoreDocumentStore | null) {}
  private document(token: string) {
    if (!/^[a-f0-9]{64}$/.test(token)) throw new Error('Invalid download link.');
    const db = this.getStore();
    if (!db) throw new Error('Download storage is not configured.');
    return db.collection('downloadTickets').doc(crypto.createHash('sha256').update(token).digest('hex'));
  }
  async issue(ticket: DownloadTicket): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    await this.document(token).set(ticket, { exists: false });
    return token;
  }
  async read(token: string, ipHash: string, now = Date.now()) {
    const snapshot = await this.document(token).get();
    const ticket = snapshot.data() as DownloadTicket | undefined;
    if (!ticket || ticket.used || ticket.expiresAt <= now) throw new Error('Download link has expired or was already used.');
    if (ticket.clientIpHash !== ipHash) throw new Error('Download link belongs to a different network.');
    return { ticket, updateTime: snapshot.updateTime };
  }
  async consume(token: string, ipHash: string) {
    const { ticket, updateTime } = await this.read(token, ipHash);
    // Exactly one competing request can consume the ticket.
    await this.document(token).set({ ...ticket, used: true }, { updateTime });
  }
}
