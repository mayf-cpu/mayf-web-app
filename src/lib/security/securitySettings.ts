import crypto from 'node:crypto';
import type { FirestoreDocumentStore } from '../firebase/documentStore';
import { getAdminFirestore } from '../firebase/admin';
type Actor = { uid: string; email: string; role?: string };
type Settings = { emergencyMaintenanceMode: boolean; updatedAt: string; updatedBy: string };
const defaults: Settings = { emergencyMaintenanceMode: false, updatedAt: '', updatedBy: '' };
function parse(row: Record<string, any> | undefined): Settings {
  if (!row) return { ...defaults };
  if (typeof row.emergencyMaintenanceMode !== 'boolean') throw new Error('Invalid maintenance configuration');
  return { emergencyMaintenanceMode: row.emergencyMaintenanceMode,
    updatedAt: String(row.updatedAt || ''), updatedBy: String(row.updatedBy || '') };
}
/** No volatile success state; the setting and audit event share one conditional commit. */
export function createSecuritySettings(getStore: () => FirestoreDocumentStore | null) {
  const store = () => { const db = getStore(); if (!db) throw new Error('Security settings storage unavailable'); return db; };
  return {
    read: async () => parse((await store().collection('runtimeSecuritySettings').doc('global').get()).data()),
    save: async (input: Record<string, unknown>, actor: Actor) => {
      if (actor.role !== 'superAdmin') throw new Error('Only superAdmin can change maintenance mode');
      if (!actor.uid || !actor.email || !input || typeof input !== 'object' || Array.isArray(input) ||
          Object.keys(input).some(key => key !== 'emergencyMaintenanceMode') ||
          typeof input.emergencyMaintenanceMode !== 'boolean') throw new Error('Only a boolean emergencyMaintenanceMode is supported');
      const db = store(); const previous = await db.collection('runtimeSecuritySettings').doc('global').get();
      if (previous.exists && !previous.updateTime) throw new Error('Maintenance settings revision unavailable');
      const old = parse(previous.data()); const timestamp = new Date().toISOString();
      const next = { emergencyMaintenanceMode: input.emergencyMaintenanceMode, updatedAt: timestamp, updatedBy: actor.email };
      const id = 'security-' + crypto.randomUUID();
      await db.commit([
        { collection: 'runtimeSecuritySettings', id: 'global', updateTime: previous.updateTime, data: next },
        { collection: 'adminAuditLogs', id, data: { id, timestamp, action: 'SECURITY_CONFIG_UPDATED', category: 'security',
          actorUid: actor.uid, actorEmail: actor.email, actorRole: 'superAdmin', targetId: 'runtime-security',
          targetType: 'security_infrastructure', status: 'success',
          details: { previousMaintenanceMode: old.emergencyMaintenanceMode, emergencyMaintenanceMode: next.emergencyMaintenanceMode } } },
      ]);
      return next;
    },
  };
}
export const securitySettings = createSecuritySettings(getAdminFirestore);
