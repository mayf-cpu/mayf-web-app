/**
 * Google Drive staging to permanent asset storage adapter.
 *
 * IMPORTANT: A Drive file ID is not itself a copy of the file. Never invent
 * production URLs or byte counts. Until authenticated Drive reads and a
 * verified R2 write are wired together, ingestion must fail explicitly.
 */
export interface StorageIngestResult {
  productionFileUrl: string;
  productionThumbnailUrl?: string;
  fileSizeBytes: number;
  mimeType: string;
  sourceDriveFileId?: string;
}

export async function copyDriveFileToProductionStorage(
  driveFileId: string | undefined,
  _thumbnailDriveFileId: string | undefined,
  _slug: string,
  _contentType: string,
  _accessType: 'free' | 'paid'
): Promise<StorageIngestResult> {
  if (!driveFileId?.trim()) {
    throw new Error('Cannot import file: source Google Drive file ID is missing.');
  }
  throw new Error(
    'Google Drive ingestion is not configured: authenticated source download and ' +
    'verified private storage upload are required before marking a job successful.'
  );
}
