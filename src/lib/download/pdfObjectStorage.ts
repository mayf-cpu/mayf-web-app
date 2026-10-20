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
export interface PdfR2Bucket {
  head(key: string): Promise<{ size: number } | null>;
  get(key: string): Promise<PdfR2Object | null>;
}
let bucket: PdfR2Bucket | null = null;
export function configurePdfBucket(value: PdfR2Bucket | null): void { bucket = value; }
export function getPdfBucket(): PdfR2Bucket | null { return bucket; }
export function keyForPdf(contentId: string): string {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,149}$/.test(contentId)) throw new Error('Invalid content ID');
  return 'pdf/' + contentId + '.pdf';
}
const MAX_PDF_BYTES = 30 * 1024 * 1024;
export async function pdfExists(contentId: string): Promise<boolean> {
  if (!bucket) return false;
  const metadata = await bucket.head(keyForPdf(contentId));
  return Boolean(metadata && Number.isSafeInteger(metadata.size) &&
    metadata.size > 8 && metadata.size <= MAX_PDF_BYTES);
}
export async function readVerifiedPdf(contentId: string): Promise<Uint8Array | null> {
  if (!bucket) return null;
  const data = await bucket.get(keyForPdf(contentId));
  if (!data || !data.body || !Number.isSafeInteger(data.size) ||
      data.size <= 8 || data.size > MAX_PDF_BYTES) return null;
  const bytes = new Uint8Array(await new Response(data.body).arrayBuffer());
  if (bytes.length !== data.size || bytes.length < 8) return null;
  // Reject text, HTML error pages and non-PDF objects even if metadata says PDF.
  if (String.fromCharCode(...bytes.subarray(0, 5)) !== '%PDF-') return null;
  return bytes;
}
