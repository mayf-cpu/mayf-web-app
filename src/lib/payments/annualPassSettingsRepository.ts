import { DocumentStateRepository } from '../firebase/documentStateRepository';
import { getAdminFirestore } from '../firebase/admin';
import type { FirestoreDocumentStore } from '../firebase/documentStore';
import { EntitlementService, entitlementService } from './entitlementService';
import type { AnnualPassSettings } from './types';
export function createAnnualPassSettingsRepository(service: EntitlementService, getStore: () => FirestoreDocumentStore | null) {
  const repository = new DocumentStateRepository([{ collection: 'annualPassSettings', state: service.settingsState }], () => {
    const db = getStore(); if (!db) throw new Error('Annual Pass settings require configured Firestore storage.'); return db;
  }, 'annualPassSettingsState');
  return { read: () => repository.run(() => service.getSettings()), save: (input: Partial<AnnualPassSettings>, actor: string) => repository.run(() => service.updateSettings(input, actor), true) };
}
export const annualPassSettings = createAnnualPassSettingsRepository(entitlementService, getAdminFirestore);
