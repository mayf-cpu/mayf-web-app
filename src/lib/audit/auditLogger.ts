import crypto from 'node:crypto';
import { getAdminFirestore } from '../firebase/admin';
import type { FirestoreDocumentStore } from '../firebase/documentStore';
import { auditContext } from './auditContext';

/**
 * Server-Side Audit Logging Service.
 *
 * Tracks critical operations for compliance and defence-in-depth:
 * - Admin creation & removal
 * - Pro grants & revokes
 * - Annual Pass changes (grants, extensions, expiry edits)
 * - Content deletion
 * - Refund-related changes
 * - Security configuration changes
 * - User disables & policy deletions
 */

export type AuditAction =
  | 'ADMIN_CREATED'
  | 'ADMIN_REMOVED'
  | 'ADMIN_CLAIMS_UPDATED'
  | 'PRO_GRANTED'
  | 'PRO_REVOKED'
  | 'ANNUAL_PASS_GRANTED'
  | 'ANNUAL_PASS_REVOKED'
  | 'ANNUAL_PASS_EXPIRY_UPDATED'
  | 'CONTENT_CREATED'
  | 'CONTENT_UPDATED'
  | 'CONTENT_PUBLISHED'
  | 'CONTENT_UNPUBLISHED'
  | 'CONTENT_HIDDEN'
  | 'CONTENT_UNHIDDEN'
  | 'CONTENT_ARCHIVED'
  | 'CONTENT_RESTORED'
  | 'CONTENT_DUPLICATED'
  | 'CONTENT_REORDERED'
  | 'CONTENT_DELETED'
  | 'REFUND_PROCESSED'
  | 'REFUND_REQUESTED'
  | 'SECURITY_CONFIG_UPDATED'
  | 'USER_DISABLED'
  | 'USER_ENABLED'
  | 'USER_DELETED_POLICY'
  | 'BROADCAST_CREATED'
  | 'BROADCAST_UPDATED'
  | 'BROADCAST_DELETED';

export type AuditCategory = 'admin' | 'subscription' | 'content' | 'refund' | 'security' | 'user' | 'broadcast';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  category: AuditCategory;
  actorUid: string;
  actorEmail: string;
  actorRole: 'admin' | 'superAdmin';
  targetId: string;
  targetEmail?: string;
  targetType: string;
  details: Record<string, any>;
  ipAddress?: string;
  status: 'success' | 'failed';
}

export class AuditLogService {
  private local: AuditLogEntry[] = [];
  constructor(private getStore: () => FirestoreDocumentStore | null = getAdminFirestore) {}
  public async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
    const fullEntry: AuditLogEntry = { ...entry, id: `audit-${crypto.randomUUID()}`, timestamp: new Date().toISOString() };
    const staged = auditContext.getStore();
    if (staged) { staged.push(fullEntry); return fullEntry; }
    const db = this.getStore();
    if (db) await db.collection('auditLogs').doc(fullEntry.id).set(fullEntry, { exists: false });
    else if (process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production') throw new Error('Audit storage is not configured.');
    else this.local.unshift(fullEntry);
    return fullEntry;
  }
  public async getLogs(filter?: { category?: string; action?: string; actorEmail?: string; targetId?: string; limit?: number }): Promise<AuditLogEntry[]> {
    const db = this.getStore();
    if (!db && (process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production')) throw new Error('Audit storage is not configured.');
    let result = db ? (await db.list('auditLogs')).map(doc => ({ ...doc.data, id: doc.id } as AuditLogEntry)) : [...this.local];
    if (filter?.category && filter.category !== 'all') result = result.filter(row => row.category === filter.category);
    if (filter?.action) result = result.filter(row => row.action === filter.action);
    if (filter?.actorEmail) result = result.filter(row => row.actorEmail.toLowerCase().includes(filter.actorEmail!.toLowerCase()));
    if (filter?.targetId) result = result.filter(row => row.targetId === filter.targetId);
    const limit = Number.isFinite(filter?.limit) ? Math.max(1, Math.min(1000, Math.floor(filter!.limit!))) : 100;
    return result.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, limit);
  }
  public async exportCsv(category?: string): Promise<string> {
    const items = await this.getLogs({ category, limit: 1000 });
    const cell = (value: unknown) => {
      let text = String(value ?? '');
      if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
      return '"' + text.replace(/"/g, '""') + '"';
    };
    return 'ID,Timestamp,Action,Category,ActorEmail,ActorRole,TargetId,TargetType,Status,Details\n' + items.map(i => [i.id, i.timestamp, i.action, i.category, i.actorEmail, i.actorRole, i.targetId, i.targetType, i.status, JSON.stringify(i.details)].map(cell).join(',')).join('\n');
  }
}
export const auditLogService = new AuditLogService();
