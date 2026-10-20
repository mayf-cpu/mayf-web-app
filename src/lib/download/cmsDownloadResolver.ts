import type { FirestoreDocumentStore } from '../firebase/documentStore';
import type { DownloadableItem } from './downloadRegistry';
import { getDownloadableItem } from './downloadRegistry';

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
    if (item.isDeleted || item.visible !== true || item.downloadAllowed !== true ||
        item.status !== 'published' || item.contentType !== 'pdf' ||
        (item.accessType !== 'paid' && item.accessType !== 'free') ||
        !Array.isArray(item.files) || !item.files.some((f: any) =>
          typeof f?.url === 'string' && f.url === 'r2://mayf-study-materials/pdf/' + item.id + '.pdf')) return null;
    return {
      id: item.id,
      slug: item.slug,
      title: item.title,
      accessType: item.accessType,
      downloadAllowed: true,
      classLevel: Array.isArray(item.classLevels) ? item.classLevels.join(', ') : '',
      category: item.categoryId || '',
      fileName: (item.slug || item.id).replace(/[^a-zA-Z0-9_-]/g, '_') + '.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: Number(item.files.find((f: any) => f.url === 'r2://mayf-study-materials/pdf/' + item.id + '.pdf')?.sizeBytes || 0),
      description: item.shortDescription || '',
    };
  }
  return getDownloadableItem(idOrSlug);
}
