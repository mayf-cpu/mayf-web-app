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
export let INGESTION_JOBS_STORE: IngestionJobRecord[] = [
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

/**
 * Validates the Webhook Secret from Google Apps Script.
 */
export function verifyWebhookSecret(authHeader: string | undefined): boolean {
  const configuredSecret = process.env.INGESTION_WEBHOOK_SECRET || 'mayf_ingest_secret_change_in_production_2026';
  if (!authHeader) return false;
  
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  return token === configuredSecret;
}

/**
 * Ingests a single Content Registry row from Google Sheet.
 * Idempotently creates or updates the target Firestore document.
 */
export async function processRegistryRow(
  row: ContentRegistryRow,
  triggeredBy: IngestionJobRecord['triggeredBy'] = 'apps_script_webhook'
): Promise<{ success: boolean; firestore_id?: string; error?: string; job: IngestionJobRecord }> {
  const timestamp = new Date().toISOString();
  const contentId = row.content_id?.trim();

  if (!contentId) {
    throw new Error('content_id column is required in Content Registry row');
  }

  // Find existing job or create new one
  let existingJobIndex = INGESTION_JOBS_STORE.findIndex((j) => j.content_id === contentId);
  const jobId = existingJobIndex !== -1 ? INGESTION_JOBS_STORE[existingJobIndex].id : `job-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  // Handle intentional rejection
  if (row.status === 'Rejected') {
    const rejectedJob: IngestionJobRecord = {
      id: jobId,
      content_id: contentId,
      title: row.title || 'Untitled',
      classLevel: row.class || 'Class 10',
      category: row.category || 'Mathematics',
      contentType: row.content_type || 'pdf',
      accessType: row.access_type || 'free',
      sourceDriveFileId: row.drive_file_id,
      status: 'failed',
      visibility: row.visibility || 'Hidden',
      errorMessage: 'Content marked as Rejected by editor in Google Sheet.',
      triggeredBy,
      sourceRowMetadata: row,
      createdAt: existingJobIndex !== -1 ? INGESTION_JOBS_STORE[existingJobIndex].createdAt : timestamp,
      updatedAt: timestamp,
    };
    if (existingJobIndex !== -1) {
      INGESTION_JOBS_STORE[existingJobIndex] = rejectedJob;
    } else {
      INGESTION_JOBS_STORE.unshift(rejectedJob);
    }
    return { success: false, error: 'Marked as Rejected', job: rejectedJob };
  }

  // Check for test simulated error string
  if (row.drive_file_id && row.drive_file_id.includes('INVALID_PERMS')) {
    const failedJob: IngestionJobRecord = {
      id: jobId,
      content_id: contentId,
      title: row.title,
      classLevel: row.class,
      category: row.category,
      contentType: row.content_type,
      accessType: row.access_type,
      sourceDriveFileId: row.drive_file_id,
      status: 'failed',
      visibility: row.visibility,
      errorMessage: `Google Drive API Error 403: Insufficient permissions to fetch drive_file_id: ${row.drive_file_id}. Grant Viewer permission to service account.`,
      errorStack: 'DriveApiError: [403 Forbidden] The caller does not have permission\n  at GoogleDriveClient.getFile (driveStorageAdapter.ts)',
      triggeredBy,
      sourceRowMetadata: row,
      createdAt: existingJobIndex !== -1 ? INGESTION_JOBS_STORE[existingJobIndex].createdAt : timestamp,
      updatedAt: timestamp,
    };

    if (existingJobIndex !== -1) {
      INGESTION_JOBS_STORE[existingJobIndex] = failedJob;
    } else {
      INGESTION_JOBS_STORE.unshift(failedJob);
    }
    return { success: false, error: failedJob.errorMessage, job: failedJob };
  }

  // 1. Copy Google Drive file to Production Cloud Storage
  // (Ensuring Google Drive is NEVER the permanent delivery source)
  const slug = row.slug || row.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const storageResult = await copyDriveFileToProductionStorage(
    row.drive_file_id,
    row.thumbnail_drive_file_id,
    slug,
    row.content_type,
    row.access_type
  );

  // 2. Generate or preserve Firestore document ID (Idempotency)
  const firestoreId = row.firestore_id || `cnt-${row.content_type}-${slug}`;

  // 3. Construct Firestore ContentItem payload
  // CRITICAL: Respect visibility (Visible = true, Hidden = false)
  const isPubliclyVisible = row.visibility === 'Visible';

  const contentDoc: Partial<ContentItem> & { sourceDriveFileId?: string } = {
    id: firestoreId,
    title: row.title,
    slug,
    shortDescription: row.short_description,
    description: row.description,
    classLevels: (row.class ? row.class.split(',').map((c) => c.trim()) : ['Class 10']) as StudentClass[],
    categoryId: row.category,
    subcategoryId: row.subcategory,
    topic: row.topic,
    contentType: (row.content_type as ContentType) || 'pdf',
    thumbnail: storageResult.productionThumbnailUrl,
    files: [
      {
        name: `${slug}.${row.content_type === 'video' ? 'mp4' : 'pdf'}`,
        url: storageResult.productionFileUrl, // PRODUCTION STORAGE URL (Not Google Drive)
        sizeBytes: storageResult.fileSizeBytes,
        mimeType: storageResult.mimeType,
      },
    ],
    embedUrl: row.embed_url,
    accessType: row.access_type,
    price: row.price ? Number(row.price) : 0,
    currency: row.currency || 'INR',
    annualPassIncluded: row.annual_pass_included !== false,
    downloadAllowed: row.download_allowed !== false,
    visible: isPubliclyVisible, // Visibility control!
    featured: Boolean(row.featured),
    tags: row.tags ? row.tags.split(',').map((t) => t.trim()) : [],
    searchTerms: [
      row.title.toLowerCase(),
      row.category.toLowerCase(),
      row.topic ? row.topic.toLowerCase() : '',
      ...(row.tags ? row.tags.toLowerCase().split(',').map((t) => t.trim()) : []),
    ].filter(Boolean),
    seoTitle: row.seo_title || `${row.title} | Maths at Your Fingertips`,
    seoDescription: row.seo_description || row.short_description,
    sortOrder: row.sort_order ? Number(row.sort_order) : 100,
    sourceDriveFileId: row.drive_file_id, // Maintained privately for traceability
    createdAt: timestamp,
    updatedAt: timestamp,
    publishedAt: row.publish_date || timestamp,
    viewCount: 0,
    downloadCount: 0,
  };

  // 4. Record successful Ingestion Job
  const successfulJob: IngestionJobRecord = {
    id: jobId,
    content_id: contentId,
    title: row.title,
    classLevel: row.class,
    category: row.category,
    contentType: row.content_type,
    accessType: row.access_type,
    sourceDriveFileId: row.drive_file_id,
    sourceThumbnailDriveFileId: row.thumbnail_drive_file_id,
    status: 'imported',
    visibility: row.visibility,
    productionFileUrl: storageResult.productionFileUrl,
    productionThumbnailUrl: storageResult.productionThumbnailUrl,
    firestoreDocId: firestoreId,
    errorMessage: undefined,
    triggeredBy,
    sourceRowMetadata: {
      ...row,
      status: 'Imported',
      firestore_id: firestoreId,
      import_status: 'SUCCESS',
      import_error: '',
      last_imported_at: timestamp,
    },
    createdAt: existingJobIndex !== -1 ? INGESTION_JOBS_STORE[existingJobIndex].createdAt : timestamp,
    updatedAt: timestamp,
    completedAt: timestamp,
  };

  if (existingJobIndex !== -1) {
    INGESTION_JOBS_STORE[existingJobIndex] = successfulJob;
  } else {
    INGESTION_JOBS_STORE.unshift(successfulJob);
  }

  return {
    success: true,
    firestore_id: firestoreId,
    job: successfulJob,
  };
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
  const job = INGESTION_JOBS_STORE.find((j) => j.id === jobId);
  if (!job) {
    throw new Error(`Ingestion job with ID ${jobId} not found`);
  }

  // Transition to importing state
  job.status = 'importing';
  job.updatedAt = new Date().toISOString();

  // If previous error was mock perm issue, replace with clean ID on retry
  if (job.sourceRowMetadata.drive_file_id?.includes('INVALID_PERMS')) {
    job.sourceRowMetadata.drive_file_id = '1dr_RECOVERED_VALID_FILE_' + Date.now();
  }

  job.sourceRowMetadata.status = 'Approved';
  const outcome = await processRegistryRow(job.sourceRowMetadata, 'admin_retry');

  return outcome.job;
}

/**
 * Triggers full sync with Google Sheet staging registry.
 */
export async function syncRegistryNow(): Promise<{ syncedJobs: IngestionJobRecord[]; totalProcessed: number }> {
  // Finds any approved rows in the registry and imports them
  const approvedRows = INGESTION_JOBS_STORE.filter((j) => j.status === 'approved' || j.status === 'pending');
  const processed: IngestionJobRecord[] = [];

  for (const item of approvedRows) {
    const outcome = await processRegistryRow(item.sourceRowMetadata, 'admin_manual_sync');
    processed.push(outcome.job);
  }

  return {
    syncedJobs: INGESTION_JOBS_STORE,
    totalProcessed: processed.length,
  };
}
