import { AsyncLocalStorage } from 'node:async_hooks';
import type { AuditLogEntry } from './auditLogger';
/** Repository operations stage audit records for the same atomic Firestore commit. */
export const auditContext = new AsyncLocalStorage<AuditLogEntry[]>();
