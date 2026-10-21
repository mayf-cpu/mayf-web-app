import { hasPdfMarkers } from './pdfIntegrity';
/**
 * Optional private R2 PDF storage. Files are never addressed by user input:
 * a registry contentId resolves to pdf/<contentId>.pdf.
 * A bucket binding must be provisioned explicitly before downloads activate.
 */
export interface PdfR2Object {
  body: ReadableStream<Uint8Array> | null;
  size: number;
  httpMetadata?: { contentType?: string };
}
export function versionedPdfKey(contentId: string, sha256: string): string {
  keyForPdf(contentId);
  if (!/^[a-f0-9]{64}$/.test(sha256)) throw new Error('Invalid PDF checksum');
  return 'pdf/' + contentId + '/' + sha256 + '.pdf';
}
export function allowedPdfKey(contentId: string, key?: string): string {
  if (!key) return keyForPdf(contentId);
  if (key === keyForPdf(contentId)) return key;
  if (!/^pdf\/[a-zA-Z0-9][a-zA-Z0-9_-]{0,149}\/[a-f0-9]{64}\.pdf$/.test(key) ||
      !key.startsWith('pdf/' + contentId + '/')) throw new Error('Invalid private PDF object key');
  return key;
}
export interface PdfR2Bucket {
  head(key: string): Promise<{ size: number } | null>;
  get(key: string): Promise<PdfR2Object | null>;
  put?(key: string, value: Uint8Array, options?: { httpMetadata?: { contentType: string } }): Promise<unknown>;
}
let bucket: PdfR2Bucket | null = null;
export function configurePdfBucket(value: PdfR2Bucket | null): void { bucket = value; }
export function getPdfBucket(): PdfR2Bucket | null { return bucket; }
export function keyForPdf(contentId: string): string {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,149}$/.test(contentId)) throw new Error('Invalid content ID');
  return 'pdf/' + contentId + '.pdf';
}
const MAX_PDF_BYTES = 30 * 1024 * 1024;
export async function pdfExists(contentId: string, key?: string): Promise<boolean> {
  if (!bucket) return false;
  const metadata = await bucket.head(allowedPdfKey(contentId, key));
  return Boolean(metadata && Number.isSafeInteger(metadata.size) &&
    metadata.size > 8 && metadata.size <= MAX_PDF_BYTES);
}
export async function readVerifiedPdf(contentId: string, key?: string): Promise<Uint8Array | null> {
  if (!bucket) return null;
  const data = await bucket.get(allowedPdfKey(contentId, key));
  if (!data || !data.body || !Number.isSafeInteger(data.size) ||
      data.size <= 8 || data.size > MAX_PDF_BYTES) return null;
  const bytes = new Uint8Array(await new Response(data.body).arrayBuffer());
  if (bytes.length !== data.size || bytes.length < 8) return null;
  // Reject text, HTML error pages and non-PDF objects even if metadata says PDF.
  if (!hasPdfMarkers(bytes)) return null;
  return bytes;
}
