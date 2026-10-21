import { DocumentStateRepository } from '../firebase/documentStateRepository';
import { getAdminFirestore } from '../firebase/admin';
import { paymentService } from './paymentService';

/** Separate storage boundary: gateway credentials never join public catalogue state. */
export const paymentSettingsRepository = new DocumentStateRepository(
  [{ collection: 'paymentRuntimeSettings', state: paymentService.settingsState }],
  getAdminFirestore,
  'paymentSettingsState',
);
