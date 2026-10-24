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

class AuditLogService {
  // No synthetic audit history. Persisted entries are loaded by the repository.
  private logs: AuditLogEntry[] = [];

  public exportState(): Record<string, any>[] {
    return this.logs.map(entry => structuredClone(entry));
  }

  public importState(entries: Record<string, any>[]): void {
    this.logs = (entries as AuditLogEntry[]).slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  public log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const fullEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    this.logs.unshift(fullEntry);

    console.info(`[AUDIT LOG] ${fullEntry.action} by ${fullEntry.actorEmail} on ${fullEntry.targetId}:`, fullEntry.details);
    return fullEntry;
  }

  public getLogs(filter?: {
    category?: string;
    action?: string;
    actorEmail?: string;
    targetId?: string;
    limit?: number;
  }): AuditLogEntry[] {
    let result = [...this.logs];

    if (filter?.category && filter.category !== 'all') {
      result = result.filter((l) => l.category === filter.category);
    }
    if (filter?.action) {
      result = result.filter((l) => l.action === filter.action);
    }
    if (filter?.actorEmail) {
      result = result.filter((l) => l.actorEmail.toLowerCase().includes(filter.actorEmail!.toLowerCase()));
    }
    if (filter?.targetId) {
      result = result.filter((l) => l.targetId === filter.targetId);
    }

    const limit = filter?.limit || 100;
    return result.slice(0, limit);
  }

  public exportCsv(category?: string): string {
    const items = this.getLogs(category ? { category } : undefined);
    const headers = 'ID,Timestamp,Action,Category,ActorEmail,ActorRole,TargetId,TargetType,Status,Details\n';
    const rows = items
      .map((i) => {
        const detailsEscaped = JSON.stringify(i.details).replace(/"/g, '""');
        return `"${i.id}","${i.timestamp}","${i.action}","${i.category}","${i.actorEmail}","${i.actorRole}","${i.targetId}","${i.targetType}","${i.status}","${detailsEscaped}"`;
      })
      .join('\n');
    return headers + rows;
  }
}

export const auditLogService = new AuditLogService();
