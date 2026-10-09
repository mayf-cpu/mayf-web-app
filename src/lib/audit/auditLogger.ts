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
  private logs: AuditLogEntry[] = [
    {
      id: 'audit-101',
      timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
      action: 'ADMIN_CREATED',
      category: 'admin',
      actorUid: 'admin-super-001',
      actorEmail: '2026vivekkushwah@gmail.com',
      actorRole: 'superAdmin',
      targetId: 'admin-002',
      targetEmail: 'admin@mayf.co.in',
      targetType: 'admin_account',
      details: { roleAssigned: 'admin', claims: { admin: true, superAdmin: false } },
      ipAddress: '103.21.244.0',
      status: 'success',
    },
    {
      id: 'audit-102',
      timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      action: 'SECURITY_CONFIG_UPDATED',
      category: 'security',
      actorUid: 'admin-super-001',
      actorEmail: '2026vivekkushwah@gmail.com',
      actorRole: 'superAdmin',
      targetId: 'sys-firebase-auth-policy',
      targetType: 'auth_policy',
      details: {
        change: 'Enforced direct Firebase Auth token verification on administrative routes',
        requireEdgeVerification: false,
      },
      ipAddress: '103.21.244.0',
      status: 'success',
    },
    {
      id: 'audit-103',
      timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
      action: 'ANNUAL_PASS_GRANTED',
      category: 'subscription',
      actorUid: 'admin-002',
      actorEmail: 'admin@mayf.co.in',
      actorRole: 'admin',
      targetId: 'student-1001',
      targetEmail: 'arjun.sharma@mayf.co.in',
      targetType: 'student_entitlement',
      details: {
        tier: 'annual_pass',
        expiryDate: '2027-03-31',
        reason: 'Academic scholarship sponsorship',
      },
      ipAddress: '103.22.200.12',
      status: 'success',
    },
    {
      id: 'audit-104',
      timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
      action: 'CONTENT_DELETED',
      category: 'content',
      actorUid: 'admin-002',
      actorEmail: 'admin@mayf.co.in',
      actorRole: 'admin',
      targetId: 'draft-ch-old-circles',
      targetType: 'chapter',
      details: {
        title: 'Deprecated Circles 2024 Practice Sheet',
        replacedBy: 'ch-class10-circles-ncert-2026',
      },
      ipAddress: '103.22.200.12',
      status: 'success',
    },
    {
      id: 'audit-105',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      action: 'REFUND_PROCESSED',
      category: 'refund',
      actorUid: 'admin-super-001',
      actorEmail: '2026vivekkushwah@gmail.com',
      actorRole: 'superAdmin',
      targetId: 'ord-802',
      targetEmail: 'priya.patel@gmail.com',
      targetType: 'payment_order',
      details: {
        amount: 2999,
        currency: 'INR',
        provider: 'stripe',
        reason: 'Customer accidental double checkout',
      },
      ipAddress: '103.21.244.0',
      status: 'success',
    },
  ];

  public log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const fullEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    this.logs.unshift(fullEntry);
    if (this.logs.length > 500) {
      this.logs.pop();
    }

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
