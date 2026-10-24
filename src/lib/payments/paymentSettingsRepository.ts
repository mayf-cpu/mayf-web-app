import { DocumentStateRepository } from '../firebase/documentStateRepository';
import { getAdminFirestore } from '../firebase/admin';
import { paymentService } from './paymentService';
import { paymentSettingsStorage } from './paymentSettingsStorage';

const storage = paymentSettingsStorage();

/** Separate storage boundary: gateway credentials never join public catalogue state. */
export const paymentSettingsRepository = new DocumentStateRepository(
  [{ collection: storage.collection, state: paymentService.settingsState }],
  () => {
    const db = getAdminFirestore();
    if (!db) throw new Error('Payment settings require configured Firestore storage');
    return db;
  },
  storage.marker,
);
