import crypto from 'node:crypto';
/**
 * Server-Side Ingestion Pipeline Service for Maths at Your Fingertips.
 * 
 * CORE RULES IMPLEMENTED:
 * 1. Google Drive is strictly the staging area — files are transferred to production Cloud Storage.
 * 2. Idempotency: re-importing the same content_id updates the existing item without duplicates.
 * 3. Visibility rule: Visible publishes to catalogue; Hidden stores it in Firestore but prevents public appearance.
 * 4. Maintains original source Drive file IDs for audit and traceability, but keeps them private.
 * 5. Job status tracking: pending, approved, importing, imported, failed with actionable error recording.
 */

import { ContentRegistryRow, IngestionJobRecord, ImportJobStatus, WebhookIngestResponse } from './types';
import { copyDriveFileToProductionStorage } from './driveStorageAdapter';
import { ContentItem, StudentClass, ContentType } from '../firebase/types';

// In-memory persistent job store (synced with Firestore /importJobs in live environment)
export let INGESTION_JOBS_STORE: IngestionJobRecord[] = (process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production') ? [] : [
  // 1. IMPORTED - Class 10 Real Numbers
  {
    id: 'job-ingest-001',
    content_id: 'MAYF-C10-ALG-001',
    title: 'Pair of Linear Equations in Two Variables Complete Mastery Guide',
    classLevel: 'Class 10',
    category: 'Algebra',
    contentType: 'pdf',
    accessType: 'free',
    sourceDriveFileId: '1dr_8xK9ZqWvL3mNp7T2sF4hY5bC',
    sourceThumbnailDriveFileId: '1thumb_4yJ7xP2wQ9vL5mN',
    status: 'imported',
    visibility: 'Visible',
    productionFileUrl: 'https://storage.googleapis.com/mayf-production-assets.storage.googleapis.com/production-curriculum/free/pdf/pair-of-linear-equations-in-two-variables.pdf',
    productionThumbnailUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
    firestoreDocId: 'ch-linear-equations',
    triggeredBy: 'apps_script_webhook',
    sourceRowMetadata: {
      content_id: 'MAYF-C10-ALG-001',
      title: 'Pair of Linear Equations in Two Variables Complete Mastery Guide',
      slug: 'pair-of-linear-equations-in-two-variables',
      short_description: 'Graphical consistency, substitution, elimination, and reducible systems.',
      description: 'Comprehensive 24-page chapter breakdown with NCERT exemplar proofs and board exam patterns.',
      class: 'Class 10',
      category: 'Algebra',
      subcategory: 'Linear Equations',
      topic: 'Algebraic Methods',
      content_type: 'pdf',
      access_type: 'free',
      price: 0,
      currency: 'INR',
      annual_pass_included: true,
      download_allowed: true,
      drive_file_id: '1dr_8xK9ZqWvL3mNp7T2sF4hY5bC',
      thumbnail_drive_file_id: '1thumb_4yJ7xP2wQ9vL5mN',
      tags: 'Class 10, Linear Equations, Elimination Method, CBSE',
      seo_title: 'Class 10 Linear Equations in Two Variables PDF | MAYF',
      seo_description: 'Master Class 10 linear equations with step-by-step worked examples.',
      status: 'Imported',
      visibility: 'Visible',
      featured: true,
      sort_order: 1,
      publish_date: '2026-04-01T10:00:00Z',
      firestore_id: 'ch-linear-equations',
      import_status: 'SUCCESS',
      import_error: '',
      last_imported_at: '2026-04-01T10:05:22Z',
    },
    createdAt: '2026-04-01T10:00:00Z',
    updatedAt: '2026-04-01T10:05:22Z',
    completedAt: '2026-04-01T10:05:22Z',
  },

  // 2. IMPORTED (Hidden) - Internal Staff Assessment
  {
    id: 'job-ingest-002',
    content_id: 'MAYF-C9-GEO-002',
    title: 'Class 9 Circles & Cyclic Quadrilaterals Mock Diagnostic Assessment',
    classLevel: 'Class 9',
    category: 'Geometry',
    contentType: 'testPaper',
    accessType: 'paid',
    sourceDriveFileId: '1dr_9aB2cDefG3hI4jK5lM6nO',
    status: 'imported',
    visibility: 'Hidden',
    productionFileUrl: 'https://storage.googleapis.com/mayf-production-assets.storage.googleapis.com/production-curriculum/paid/testPaper/class-9-circles-diagnostic.pdf',
    firestoreDocId: 'cnt-test-c9-circles-internal',
    triggeredBy: 'apps_script_webhook',
    sourceRowMetadata: {
      content_id: 'MAYF-C9-GEO-002',
      title: 'Class 9 Circles & Cyclic Quadrilaterals Mock Diagnostic Assessment',
      slug: 'class-9-circles-diagnostic-internal',
      short_description: 'Draft mock exam scheduled for board preparatory cycle 2.',
      description: 'Diagnostic paper with internal rubrics. Hidden from public catalogue pending exam cycle.',
      class: 'Class 9',
      category: 'Geometry',
      subcategory: 'Circles',
      topic: 'Assessment',
      content_type: 'testPaper',
      access_type: 'paid',
      price: 199,
      currency: 'INR',
      annual_pass_included: true,
      download_allowed: true,
      drive_file_id: '1dr_9aB2cDefG3hI4jK5lM6nO',
      tags: 'Class 9, Geometry, Circles, Diagnostic',
      status: 'Imported',
      visibility: 'Hidden',
      featured: false,
      sort_order: 14,
      publish_date: '2026-04-10T00:00:00Z',
      firestore_id: 'cnt-test-c9-circles-internal',
      import_status: 'SUCCESS',
      import_error: '',
      last_imported_at: '2026-04-10T11:20:00Z',
    },
    createdAt: '2026-04-10T11:15:00Z',
    updatedAt: '2026-04-10T11:20:00Z',
    completedAt: '2026-04-10T11:20:00Z',
  },

  // 3. FAILED - Drive File Permissions Restricted
  {
    id: 'job-ingest-003',
    content_id: 'MAYF-C8-ALG-003',
    title: 'Class 8 Algebraic Identities (a+b)² Visual Multiplication Tiles',
    classLevel: 'Class 8',
    category: 'Algebra',
    contentType: 'multiImage',
    accessType: 'free',
    sourceDriveFileId: '1dr_RESTRICTED_ID_INVALID_PERMS_xyz99',
    status: 'failed',
    visibility: 'Visible',
    errorMessage: 'Google Drive API Error 403: Service account has insufficient read permissions on drive_file_id 1dr_RESTRICTED_ID_INVALID_PERMS_xyz99. Ensure staging folder is shared with mayf-drive-ingestion@mayf-edtech.iam.gserviceaccount.com as Viewer.',
    errorStack: 'DriveApiError: [403 Forbidden] The caller does not have permission\n  at GoogleDriveClient.getFile (driveStorageAdapter.ts:48:11)\n  at IngestionPipeline.processRow (ingestionService.ts:162:9)',
    triggeredBy: 'apps_script_webhook',
    sourceRowMetadata: {
      content_id: 'MAYF-C8-ALG-003',
      title: 'Class 8 Algebraic Identities (a+b)² Visual Multiplication Tiles',
      slug: 'class-8-algebraic-identities-visual-tiles',
      short_description: 'Geometric area proofs of (a+b)² = a² + 2ab + b² using square tiles.',
      description: 'Interactive slide deck illustrating square and rectangle decompositions.',
      class: 'Class 8',
      category: 'Algebra',
      subcategory: 'Polynomials',
      topic: 'Identities',
      content_type: 'multiImage',
      access_type: 'free',
      drive_file_id: '1dr_RESTRICTED_ID_INVALID_PERMS_xyz99',
      tags: 'Class 8, Identities, Multi-Image, Proof',
      status: 'Approved',
      visibility: 'Visible',
      import_status: 'FAILED',
      import_error: 'Google Drive API Error 403: Service account has insufficient read permissions.',
      last_imported_at: '2026-04-12T14:32:10Z',
    },
    createdAt: '2026-04-12T14:30:00Z',
    updatedAt: '2026-04-12T14:32:10Z',
  },

  // 4. APPROVED (Ready to Ingest)
  {
    id: 'job-ingest-004',
    content_id: 'MAYF-C10-MEN-004',
    title: 'Class 10 Frustum of a Cone: Formula Derivation & Slant Height Cheatsheet',
    classLevel: 'Class 10',
    category: 'Mensuration',
    contentType: 'formulaSheet',
    accessType: 'paid',
    sourceDriveFileId: '1dr_frustum_cone_c10_valid_file_982',
    status: 'approved',
    visibility: 'Visible',
    triggeredBy: 'apps_script_webhook',
    sourceRowMetadata: {
      content_id: 'MAYF-C10-MEN-004',
      title: 'Class 10 Frustum of a Cone: Formula Derivation & Slant Height Cheatsheet',
      slug: 'class-10-frustum-of-cone-formula-sheet',
      short_description: 'Volume V = 1/3 π h (r₁² + r₂² + r₁r₂) and Curved Surface Area formulas.',
      description: 'Quick reference sheet with similar triangles deduction of frustum dimensions.',
      class: 'Class 10',
      category: 'Mensuration',
      subcategory: 'Surface Areas and Volumes',
      topic: 'Frustum of Cone',
      content_type: 'formulaSheet',
      access_type: 'paid',
      price: 99,
      currency: 'INR',
      annual_pass_included: true,
      download_allowed: true,
      drive_file_id: '1dr_frustum_cone_c10_valid_file_982',
      tags: 'Class 10, Frustum, Mensuration, Formula Sheet',
      status: 'Approved',
      visibility: 'Visible',
      sort_order: 15,
      publish_date: '2026-04-15T00:00:00Z',
      import_status: 'PENDING',
      import_error: '',
    },
    createdAt: '2026-04-15T09:00:00Z',
    updatedAt: '2026-04-15T09:00:00Z',
  },

  // 5. PENDING (In Editorial Review)
  {
    id: 'job-ingest-005',
    content_id: 'MAYF-C7-GEO-005',
    title: 'Class 7 Lines and Angles: Complementary, Supplementary & Vertically Opposite Angles Worksheet',
    classLevel: 'Class 7',
    category: 'Geometry',
    contentType: 'worksheet',
    accessType: 'free',
    sourceDriveFileId: '1dr_c7_lines_angles_draft_882',
    status: 'pending',
    visibility: 'Visible',
    triggeredBy: 'admin_manual_sync',
    sourceRowMetadata: {
      content_id: 'MAYF-C7-GEO-005',
      title: 'Class 7 Lines and Angles: Complementary, Supplementary & Vertically Opposite Angles Worksheet',
      slug: 'class-7-lines-and-angles-worksheet',
      short_description: '20 visual geometry problems on linear pairs and transversal angle pairs.',
      description: 'Editorial review pending verification of answer key for questions 14 to 18.',
      class: 'Class 7',
      category: 'Geometry',
      subcategory: 'Triangles',
      topic: 'Lines and Angles',
      content_type: 'worksheet',
      access_type: 'free',
      drive_file_id: '1dr_c7_lines_angles_draft_882',
      tags: 'Class 7, Lines, Angles, Worksheet',
      status: 'Review',
      visibility: 'Visible',
      import_status: 'PENDING',
    },
    createdAt: '2026-04-16T12:00:00Z',
    updatedAt: '2026-04-16T12:00:00Z',
  },
];

export const ingestionState = {
  exportState: () => structuredClone(INGESTION_JOBS_STORE),
  importState: (items: Record<string, any>[]) => { INGESTION_JOBS_STORE = items as IngestionJobRecord[]; },
};

/**
 * Validates the Webhook Secret from Google Apps Script.
 */
export function verifyWebhookSecret(authHeader: string | undefined): boolean {
  const secret = process.env.INGESTION_WEBHOOK_SECRET;
  if (!secret || !authHeader || !/^Bearer\s+/i.test(authHeader)) return false;
  const supplied = Buffer.from(authHeader.replace(/^Bearer\s+/i, '').trim());
  const expected = Buffer.from(secret);
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

/**
 * Ingests a single Content Registry row from Google Sheet.
 * Idempotently creates or updates the target Firestore document.
 */
export async function processRegistryRow(row: ContentRegistryRow, triggeredBy: IngestionJobRecord['triggeredBy'] = 'apps_script_webhook'): Promise<{ success: boolean; firestore_id?: string; error?: string; job: IngestionJobRecord }> {
  const contentId = row.content_id?.trim();
  if (!contentId || contentId.length > 200 || !row.title?.trim()) throw new Error('Registry content_id and title are required.');
  const { catalogueRepository } = await import('../cms/catalogueRepository');
  const { contentCmsManager } = await import('../cms/contentManager');
  const timestamp = new Date().toISOString();
  const existing = await catalogueRepository.run(() => structuredClone(INGESTION_JOBS_STORE.find(job => job.content_id === contentId)));
  const jobId = existing?.id || `job-${crypto.createHash('sha256').update(contentId).digest('hex').slice(0, 24)}`;
  const base: IngestionJobRecord = { id: jobId, content_id: contentId, title: row.title.trim(), classLevel: row.class, category: row.category, contentType: row.content_type, accessType: row.access_type, sourceDriveFileId: row.drive_file_id, sourceThumbnailDriveFileId: row.thumbnail_drive_file_id, status: 'pending', visibility: row.visibility || 'Hidden', triggeredBy, sourceRowMetadata: structuredClone(row), createdAt: existing?.createdAt || timestamp, updatedAt: timestamp };
  const recordJob = (job: IngestionJobRecord) => { const index = INGESTION_JOBS_STORE.findIndex(item => item.content_id === contentId); if (index >= 0) INGESTION_JOBS_STORE[index] = job; else INGESTION_JOBS_STORE.unshift(job); };
  try {
    if (!['Approved', 'Imported'].includes(row.status)) throw new Error('Only an Approved registry row can be imported.');
    const slug = row.slug || row.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!/^[a-z0-9-]{1,160}$/.test(slug)) throw new Error('Registry slug must contain letters, numbers and hyphens.');
    if (!['pdf', 'course', 'testPaper', 'worksheet', 'formulaSheet', 'video', 'reel', 'youtube', 'facebook', 'singleImage', 'multiImage', 'other'].includes(row.content_type)) throw new Error('Unsupported registry content type.');
    if (!['free', 'paid'].includes(row.access_type)) throw new Error('Invalid content access type.');
    const embedded = ['youtube', 'facebook', 'course', 'other'].includes(row.content_type) && !row.drive_file_id;
    if (embedded && (!row.embed_url || !row.embed_url.startsWith('https://'))) throw new Error('Embedded content requires an HTTPS source URL.');
    const storage = embedded ? null : await copyDriveFileToProductionStorage(row.drive_file_id, row.thumbnail_drive_file_id, slug, row.content_type, row.access_type);
    const firestoreId = existing?.firestoreDocId || row.firestore_id || `cnt-${crypto.createHash('sha256').update(contentId).digest('hex').slice(0, 24)}`;
    const visible = row.visibility === 'Visible';
    const extension = storage?.mimeType === 'video/mp4' ? 'mp4' : storage?.mimeType === 'image/png' ? 'png' : storage?.mimeType === 'image/jpeg' ? 'jpg' : storage?.mimeType === 'image/webp' ? 'webp' : 'pdf';
    const payload: any = { id: firestoreId, title: row.title.trim(), slug, shortDescription: row.short_description || '', description: row.description || '', classLevels: (row.class || 'Class 10').split(',').map(value => value.trim()), categoryId: row.category, subcategoryId: row.subcategory, topic: row.topic, contentType: row.content_type, accessType: row.access_type, price: Number(row.price || 0), currency: row.currency || 'INR', annualPassIncluded: row.annual_pass_included !== false, downloadAllowed: row.download_allowed !== false && Boolean(storage), visible, status: visible ? 'published' : 'draft', featured: Boolean(row.featured), files: storage ? [{ name: `${slug}.${extension}`, url: storage.productionFileUrl, sizeBytes: storage.fileSizeBytes, mimeType: storage.mimeType }] : [], thumbnail: storage?.productionThumbnailUrl || '', embedUrl: row.embed_url || '', sourceDriveId: row.drive_file_id || '', importStatus: 'imported', lastSync: timestamp, tags: (row.tags || '').split(',').map(value => value.trim()).filter(Boolean), seoTitle: row.seo_title || row.title, seoDescription: row.seo_description || row.short_description || '' };
    const job: IngestionJobRecord = { ...base, status: 'imported', firestoreDocId: firestoreId, productionFileUrl: storage?.productionFileUrl, productionThumbnailUrl: storage?.productionThumbnailUrl, completedAt: timestamp, sourceRowMetadata: { ...row, status: 'Imported', firestore_id: firestoreId, import_status: 'SUCCESS', import_error: '', last_imported_at: timestamp } };
    await catalogueRepository.run(() => {
      const actor = { uid: 'drive-ingestion', email: 'system@mayf.co.in', role: 'admin' as const };
      if (contentCmsManager.getItem(firestoreId)) contentCmsManager.updateItem(firestoreId, payload, actor); else contentCmsManager.createItem(payload, actor);
      recordJob(job);
    }, true);
    return { success: true, firestore_id: firestoreId, job };
  } catch (error: any) {
    const job: IngestionJobRecord = { ...base, status: 'failed', errorMessage: error.message || 'Import failed.' };
    await catalogueRepository.run(() => recordJob(job), true);
    return { success: false, error: job.errorMessage, job };
  }
}

/**
 * Batch processes items sent from Google Apps Script.
 */
export async function processBatchIngestion(
  items: ContentRegistryRow[],
  triggeredBy: IngestionJobRecord['triggeredBy'] = 'apps_script_webhook'
): Promise<WebhookIngestResponse> {
  const results: WebhookIngestResponse['results'] = [];
  let importedCount = 0;
  let failedCount = 0;

  for (const row of items) {
    try {
      const outcome = await processRegistryRow(row, triggeredBy);
      if (outcome.success) {
        importedCount++;
        results.push({
          content_id: row.content_id,
          firestore_id: outcome.firestore_id,
          status: 'Imported',
          last_imported_at: new Date().toISOString(),
        });
      } else {
        failedCount++;
        results.push({
          content_id: row.content_id,
          status: 'Failed',
          import_error: outcome.error,
          last_imported_at: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      failedCount++;
      results.push({
        content_id: row.content_id,
        status: 'Failed',
        import_error: err?.message || 'Unknown ingestion exception',
        last_imported_at: new Date().toISOString(),
      });
    }
  }

  return {
    success: failedCount === 0,
    importedCount,
    failedCount,
    results,
    message: `Processed ${items.length} items: ${importedCount} successfully imported to production storage, ${failedCount} failed.`,
  };
}

/**
 * Retries a failed or pending import job by ID.
 */
export async function retryIngestionJob(jobId: string): Promise<IngestionJobRecord> {
  const { catalogueRepository } = await import('../cms/catalogueRepository');
  const job = await catalogueRepository.run(() => structuredClone(INGESTION_JOBS_STORE.find(job => job.id === jobId)));
  if (!job) throw new Error('Import job not found.');
  const outcome = await processRegistryRow(job.sourceRowMetadata, 'admin_retry');
  if (!outcome.success) throw new Error(outcome.error || 'Import retry failed.');
  return outcome.job;
}

/**
 * Triggers full sync with Google Sheet staging registry.
 */
export async function syncRegistryNow(): Promise<{ syncedJobs: IngestionJobRecord[]; totalProcessed: number; failedCount: number }> {
  const { registrySource, readRegistrySheet, writeRegistryResult } = await import('./registrySource');
  const { catalogueRepository } = await import('../cms/catalogueRepository');
  const source = await registrySource.read();
  const registry = await readRegistrySheet(source);
  const approved = registry.rows.filter(item => item.row.status === 'Approved').slice(0, 5);
  let failedCount = 0;
  for (const item of approved) {
    const outcome = await processRegistryRow(item.row, 'admin_manual_sync');
    if (!outcome.success) failedCount++;
    await writeRegistryResult(source, item.sheetRow, registry.headers, outcome, registry.token);
  }
  const jobs = await catalogueRepository.run(() => structuredClone(INGESTION_JOBS_STORE));
  return { syncedJobs: jobs, totalProcessed: approved.length, failedCount };
}
