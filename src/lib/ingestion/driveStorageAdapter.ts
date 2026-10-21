import crypto from 'node:crypto';
import { getGoogleAccessToken } from '../firebase/googleAccessToken';
import firebaseConfig from '../../config/firebasePublicConfig.json';

export interface StorageIngestResult {
  productionFileUrl: string;
  productionThumbnailUrl?: string;
  fileSizeBytes: number;
  mimeType: string;
  sourceDriveFileId?: string;
}
const maxBytes = 25 * 1024 * 1024;
async function transferFile(fileId: string, destination: string, tokenProvider = getGoogleAccessToken, expectedType = '') {
  if (!/^[a-zA-Z0-9_-]{10,200}$/.test(fileId)) throw new Error('A valid Google Drive file ID is required.');
  const driveToken = await tokenProvider(['https://www.googleapis.com/auth/drive.readonly']);
  const headers = { Authorization: `Bearer ${driveToken}` };
  const metadataResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size,modifiedTime`, { headers, signal: AbortSignal.timeout(10000) });
  if (!metadataResponse.ok) throw new Error(`Drive file could not be read (${metadataResponse.status}). Enable Drive API and share the source with the service account.`);
  const metadata = await metadataResponse.json();
  const native = ['application/vnd.google-apps.document', 'application/vnd.google-apps.presentation', 'application/vnd.google-apps.spreadsheet'].includes(metadata.mimeType);
  const mimeType = native ? 'application/pdf' : metadata.mimeType;
  const extension: Record<string, string> = { 'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'video/mp4': 'mp4' };
  if (!extension[mimeType]) throw new Error('Unsupported Drive file format. Use PDF, PNG, JPEG, WebP or MP4.');
  if (['pdf', 'testPaper', 'worksheet', 'formulaSheet'].includes(expectedType) && mimeType !== 'application/pdf') throw new Error('This registry content type requires a PDF file.');
  if (['singleImage', 'multiImage', 'thumbnail'].includes(expectedType) && !mimeType.startsWith('image/')) throw new Error('This registry content type requires an image.');
  if (['video', 'reel'].includes(expectedType) && mimeType !== 'video/mp4') throw new Error('Video content requires an MP4 file.');
  if (Number(metadata.size || 0) > maxBytes) throw new Error('Drive file exceeds the 25 MB import limit.');
  const source = native ? `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=application%2Fpdf` : `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`;
  const media = await fetch(source, { headers, redirect: 'manual', signal: AbortSignal.timeout(15000) });
  if (!media.ok) throw new Error(`Drive content download failed (${media.status}).`);
  const reader = media.body?.getReader();
  if (!reader) throw new Error('Drive file is empty.');
  const chunks: Uint8Array[] = []; let total = 0;
  try {
    for (;;) { const next = await reader.read(); if (next.done) break; total += next.value.length; if (total > maxBytes) { await reader.cancel(); throw new Error('Drive file exceeds the 25 MB import limit.'); } chunks.push(next.value); }
  } finally { reader.releaseLock(); }
  const bytes = Buffer.concat(chunks);
  if (!bytes.length || mimeType === 'application/pdf' && bytes.subarray(0, 5).toString() !== '%PDF-') throw new Error('Drive source is empty or is not a valid PDF.');
  const bucket = process.env.PRODUCTION_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket;
  if (!/^[a-z0-9][a-z0-9._-]+[a-z0-9]$/.test(bucket)) throw new Error('Production storage bucket is not configured.');
  const objectName = `${destination}/${crypto.createHash('sha256').update(fileId).update(bytes).digest('hex')}.${extension[mimeType]}`;
  const token = await tokenProvider(['https://www.googleapis.com/auth/devstorage.read_write']);
  const upload = await fetch(`https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(bucket)}/o?uploadType=media&name=${encodeURIComponent(objectName)}`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': mimeType }, body: new Uint8Array(bytes), signal: AbortSignal.timeout(20000) });
  if (!upload.ok) throw new Error(`Storage upload failed (${upload.status}). Check the configured bucket and object permissions.`);
  const stored = await upload.json();
  if (stored.name !== objectName || Number(stored.size) !== bytes.length) throw new Error('Uploaded object verification failed.');
  return { productionFileUrl: `https://storage.googleapis.com/${bucket}/${objectName}`, fileSizeBytes: bytes.length, mimeType };
}
export async function copyDriveFileToProductionStorage(driveFileId: string | undefined, thumbnailDriveFileId: string | undefined, slug: string, contentType: string, accessType: 'free' | 'paid', tokenProvider = getGoogleAccessToken): Promise<StorageIngestResult> {
  if (!driveFileId) throw new Error('A source Drive file is required for file-based content.');
  const result = await transferFile(driveFileId, `production-curriculum/${accessType}/${contentType}/${encodeURIComponent(slug)}`, tokenProvider, contentType);
  const thumbnail = thumbnailDriveFileId ? await transferFile(thumbnailDriveFileId, `production-thumbnails/${encodeURIComponent(slug)}`, tokenProvider, 'thumbnail') : undefined;
  if (thumbnail && !thumbnail.mimeType.startsWith('image/')) throw new Error('Thumbnail must be an image.');
  return { ...result, productionThumbnailUrl: thumbnail?.productionFileUrl, sourceDriveFileId: driveFileId };
}
