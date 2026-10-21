import type { FirestoreDocumentStore } from '../firebase/documentStore';
import type { PdfR2Bucket } from '../download/pdfObjectStorage';

/** Read-only probes: neither creates documents nor uploads objects. */
export async function probeStagingConnectivity(
  db: Pick<FirestoreDocumentStore, 'collection'> | null,
  bucket: Pick<PdfR2Bucket, 'head'> | null,
): Promise<{firestore: 'reachable'|'unavailable'; r2: 'reachable'|'unavailable'}> {
  let firestore: 'reachable'|'unavailable' = 'unavailable';
  let r2: 'reachable'|'unavailable' = 'unavailable';
  if (db) {
    try {
      await db.collection('stagingHealthProbe').doc('read-only-probe').get();
      firestore = 'reachable'; // A missing document still proves an authorized response.
    } catch { /* fail closed without revealing provider errors */ }
  }
  if (bucket) {
    try {
      await bucket.head('staging-health-probe/nonexistent-object');
      r2 = 'reachable'; // A missing object still proves binding/API connectivity.
    } catch { /* fail closed */ }
  }
  return { firestore, r2 };
}
