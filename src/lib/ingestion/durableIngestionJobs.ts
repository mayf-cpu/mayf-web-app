import { getAdminFirestore } from '../firebase/admin';
import type { IngestionJobRecord } from './types';

const collection = 'importJobs';

/** Store all worker-visible ingestion job updates in durable Firestore documents. */
export async function saveIngestionJob(job: IngestionJobRecord): Promise<void> {
  const db = getAdminFirestore();
  if (!db) throw new Error('Import job database unavailable');
  if (!/^[a-zA-Z0-9_-]{1,160}$/.test(job.id)) throw new Error('Invalid import job ID');
  const ref = await db.collection(collection).doc(job.id).get();
  await db.commit([{
    collection, id: job.id, data: { ...job },
    ...(ref.updateTime ? { updateTime: ref.updateTime } : {}),
  }]);
}

export async function loadIngestionJobs(): Promise<IngestionJobRecord[]> {
  const db = getAdminFirestore();
  if (!db) throw new Error('Import job database unavailable');
  const rows = await db.list(collection);
  return rows.map(row => row.data as IngestionJobRecord)
    .filter(row => row && typeof row.id === 'string' && typeof row.content_id === 'string')
    .sort((a,b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
}
