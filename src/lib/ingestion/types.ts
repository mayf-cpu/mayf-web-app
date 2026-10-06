/**
 * Content Registry & Ingestion Pipeline Types for Maths at Your Fingertips (MAYF).
 * Based on Google Sheets Content Registry staging specifications.
 */

export type RegistryStatus = 'Draft' | 'Review' | 'Approved' | 'Rejected' | 'Imported';
export type RegistryVisibility = 'Visible' | 'Hidden';
export type ImportJobStatus = 'pending' | 'approved' | 'importing' | 'imported' | 'failed';

export interface ContentRegistryRow {
  // 30 Core Columns
  content_id: string;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  class: string; // e.g. "Class 10" or "Class 9, Class 10"
  category: string;
  subcategory: string;
  topic: string;
  content_type: string; // pdf | course | testPaper | worksheet | etc.
  access_type: 'free' | 'paid';
  price?: number;
  currency?: string;
  annual_pass_included?: boolean;
  download_allowed?: boolean;
  drive_file_id?: string;
  thumbnail_drive_file_id?: string;
  embed_url?: string;
  tags?: string; // Comma-separated
  seo_title?: string;
  seo_description?: string;
  status: RegistryStatus;
  visibility: RegistryVisibility;
  featured?: boolean;
  sort_order?: number;
  publish_date?: string;
  firestore_id?: string;
  import_status?: 'PENDING' | 'IMPORTING' | 'SUCCESS' | 'FAILED' | string;
  import_error?: string;
  last_imported_at?: string;
}

export interface IngestionJobRecord {
  id: string;
  content_id: string;
  title: string;
  classLevel: string;
  category: string;
  contentType: string;
  accessType: 'free' | 'paid';
  sourceDriveFileId?: string;
  sourceThumbnailDriveFileId?: string;
  status: ImportJobStatus;
  visibility: RegistryVisibility;
  productionFileUrl?: string;
  productionThumbnailUrl?: string;
  firestoreDocId?: string;
  errorMessage?: string;
  errorStack?: string;
  triggeredBy: 'apps_script_webhook' | 'admin_manual_sync' | 'admin_retry';
  sourceRowMetadata: ContentRegistryRow;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface WebhookIngestPayload {
  secretToken: string;
  timestamp: string;
  action: 'import_approved' | 'batch_sync';
  items: ContentRegistryRow[];
  sheetId?: string;
}

export interface WebhookIngestResponse {
  success: boolean;
  importedCount: number;
  failedCount: number;
  results: {
    content_id: string;
    firestore_id?: string;
    status: 'Imported' | 'Failed';
    import_error?: string;
    last_imported_at: string;
  }[];
  message: string;
}
