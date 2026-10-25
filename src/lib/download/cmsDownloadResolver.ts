import type { FirestoreDocumentStore } from '../firebase/documentStore';
import type { DownloadableItem } from './downloadRegistry';
import { allowedPdfKey } from './pdfObjectStorage';
import { getDownloadableItem } from './downloadRegistry';

/** Shared eligibility for the public download button and authorization lookup. */
export function downloadableCmsPdfFile(item: Record<string, any>): Record<string, any> | null {
  if (item.isDeleted || item.visible !== true || item.downloadAllowed !== true || item.downloadPermissionConfirmed !== true ||
      item.status !== 'published' || item.contentType !== 'pdf' ||
      (item.accessType !== 'paid' && item.accessType !== 'free')) return null;
  const prefix = 'r2://mayf-study-materials/';
  return Array.isArray(item.files) ? item.files.find((file: any) => {
    if (typeof file?.url !== 'string' || !file.url.startsWith(prefix)) return false;
    try { allowedPdfKey(item.id, file.url.slice(prefix.length)); return true; }
    catch { return false; }
  }) || null : null;
}

/** Resolve published CMS PDFs with a private R2 object, not an external URL. */
export async function resolveDownloadableItem(
  db: Pick<FirestoreDocumentStore, 'collection' | 'queryEqual'> | null,
  idOrSlug: string,
): Promise<DownloadableItem | null> {
  if (!idOrSlug || idOrSlug.length > 160) return null;
  if (!db) return getDownloadableItem(idOrSlug);
  const ref = await db.collection('contentItems').doc(idOrSlug).get();
  let item = ref.exists ? ref.data() : undefined;
  if (!item) {
    const matches = await db.queryEqual('contentItems', 'slug', idOrSlug);
    item = matches.find(row => row.data?.slug === idOrSlug)?.data;
  }
  if (item) {
    const expectedPrefix = 'r2://mayf-study-materials/';
    const activeFile = downloadableCmsPdfFile(item);
    if (!activeFile) return null;
    return {
      id: item.id,
      objectKey: activeFile.url.slice(expectedPrefix.length),
      slug: item.slug,
      title: item.title,
      accessType: item.accessType,
      downloadAllowed: true,
      classLevel: Array.isArray(item.classLevels) ? item.classLevels.join(', ') : '',
      category: item.categoryId || '',
      fileName: (item.slug || item.id).replace(/[^a-zA-Z0-9_-]/g, '_') + '.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: Number(activeFile.sizeBytes || 0),
      description: item.shortDescription || '',
    };
  }
  // Firestore is authoritative once configured: a missing/deleted CMS record
  // must not be resurrected by the bundled static sample registry.
  return null;
}
