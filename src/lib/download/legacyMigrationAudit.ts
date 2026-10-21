import { DOWNLOADABLE_ITEMS } from './downloadRegistry';
import { allowedPdfKey, getPdfBucket, keyForPdf, readVerifiedPdf } from './pdfObjectStorage';
import type { FirestoreDocumentStore } from '../firebase/documentStore';

type AuditStore = Pick<FirestoreDocumentStore,'collection'>;
export async function auditLegacyPdfMigration(db: AuditStore) {
  const bucket = getPdfBucket();
  const rows = [];
  for (const legacy of DOWNLOADABLE_ITEMS) {
    const doc = await db.collection('contentItems').doc(legacy.id).get();
    const record = doc.exists ? doc.data() : undefined;
    const r2 = Array.isArray(record?.files) ? record.files.find((f: any) => {
      if (typeof f?.url !== 'string' || !f.url.startsWith('r2://mayf-study-materials/')) return false;
      try { allowedPdfKey(legacy.id, f.url.slice('r2://mayf-study-materials/'.length)); return true; }
      catch { return false; }
    }) : undefined;
    const key = r2?.url?.slice('r2://mayf-study-materials/'.length) || keyForPdf(legacy.id);
    const object = bucket ? await bucket.head(key) : null;
    const found = Boolean(object && Number.isSafeInteger(object.size) && object.size > 8 && object.size <= 30*1024*1024);
    const verifiedBytes = r2 && found ? await readVerifiedPdf(legacy.id, key) : null;
    const pdfValid = Boolean(verifiedBytes);
    const status = !doc.exists ? 'cms_missing' :
      record?.isDeleted ? 'cms_deleted' :
      record?.status !== 'published' || record?.visible !== true ? 'cms_not_published' :
      record?.downloadAllowed !== true ? 'downloads_disabled' :
      record?.accessType !== legacy.accessType ? 'access_mismatch' :
      !r2 ? 'cms_r2_reference_missing' :
      !found ? 'r2_file_missing' :
      !pdfValid ? 'r2_pdf_invalid' : 'ready';
    rows.push({ id: legacy.id, title: legacy.title, accessType: legacy.accessType,
      cmsExists: Boolean(doc.exists), r2FileVerifiedByHead: found, pdfBytesValidated: pdfValid, status });
  }
  return { total: rows.length, ready: rows.filter(x=>x.status==='ready').length,
    note: 'Read-only audit; published R2 PDF bytes are checked for basic PDF integrity. No files or CMS records were changed.',
    rows };
}
