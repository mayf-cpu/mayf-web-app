import { hasPdfMarkers } from '../download/pdfIntegrity';
/**
 * Authenticated Google Drive staging -> private Cloudflare R2 PDF import.
 * Never invent a public storage URL. Only confirmed PDF uploads are successes.
 */
import crypto from 'node:crypto';
import { getPdfBucket, keyForPdf } from '../download/pdfObjectStorage';

export interface StorageIngestResult {
  productionFileUrl: string;
  productionThumbnailUrl?: string;
  fileSizeBytes: number;
  mimeType: string;
  sourceDriveFileId?: string;
}
type ServiceAccount = { client_email: string; private_key: string; token_uri?: string };
function getServiceAccount(): ServiceAccount {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error('Google Drive service account is not configured');
  let data: Partial<ServiceAccount>;
  try { data = JSON.parse(json) as Partial<ServiceAccount>; }
  catch { throw new Error('Google Drive service account JSON is invalid'); }
  if (!data?.client_email || !data.private_key?.includes('PRIVATE KEY')) {
    throw new Error('Google Drive service account credentials are incomplete');
  }
  return data as ServiceAccount;
}
function jwtPart(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}
async function getDriveAccessToken(account: ServiceAccount): Promise<string> {
  const issued = Math.floor(Date.now() / 1000);
  const tokenEndpoint = 'https://oauth2.googleapis.com/token';
  const header = jwtPart({ alg: 'RS256', typ: 'JWT' });
  const payload = jwtPart({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    aud: tokenEndpoint, iat: issued, exp: issued + 3600,
  });
  const input = header + '.' + payload;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(input), account.private_key).toString('base64url');
  const response = await fetch(tokenEndpoint, {
    method: 'POST', redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: input + '.' + signature,
    }), signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('Google Drive OAuth token exchange failed (' + response.status + ')');
  const result = await response.json() as { access_token?: string };
  if (!result.access_token) throw new Error('Google Drive OAuth token not returned');
  return result.access_token;
}

export async function copyDriveFileToProductionStorage(
  driveFileId: string | undefined,
  _thumbnailDriveFileId: string | undefined,
  _slug: string,
  contentType: string,
  _accessType: 'free' | 'paid',
  contentId?: string,
): Promise<StorageIngestResult> {
  if (!driveFileId?.trim() || !/^[A-Za-z0-9_-]{5,200}$/.test(driveFileId))
    throw new Error('Cannot import file: source Google Drive file ID is missing or invalid.');
  if (contentType !== 'pdf') throw new Error('Verified Google Drive import currently supports PDF content only');
  if (!contentId) throw new Error('Content registry ID is required for private storage');
  const bucket = getPdfBucket();
  if (!bucket?.put) throw new Error('Private R2 PDF bucket is not configured for uploads');
  const key = keyForPdf(contentId);
  // Never replace bytes behind an already published CMS record. An R2 upload
  // and Firestore catalogue commit cannot be atomic across providers.
  if (await bucket.head(key)) {
    throw new Error('PDF already exists in private storage; replacement requires an explicit versioned publishing workflow.');
  }
  const token = await getDriveAccessToken(getServiceAccount());
  const url = 'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(driveFileId) + '?alt=media';
  const response = await fetch(url, {
    redirect: 'manual',
    headers: { Authorization: 'Bearer ' + token },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error('Google Drive file download failed (' + response.status + ')');
  const contentLength = Number(response.headers.get('content-length'));
  const maxBytes = 30 * 1024 * 1024;
  if (Number.isFinite(contentLength) && contentLength > maxBytes)
    throw new Error('PDF exceeds the 30 MiB import limit');
  if (!response.body) throw new Error('Google Drive returned an empty body');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > maxBytes) {
      await reader.cancel();
      throw new Error('PDF exceeds the 30 MiB import limit');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let cursor = 0;
  for (const chunk of chunks) { bytes.set(chunk, cursor); cursor += chunk.byteLength; }
  if (!hasPdfMarkers(bytes))
    throw new Error('Google Drive source is not a valid PDF');
  await bucket.put(key, bytes, { httpMetadata: { contentType: 'application/pdf' } });
  const stored = await bucket.head(key);
  if (!stored || stored.size !== bytes.length)
    throw new Error('R2 upload verification failed; import was not published');
  return {
    productionFileUrl: 'r2://mayf-study-materials/' + key,
    fileSizeBytes: bytes.length,
    mimeType: 'application/pdf',
    sourceDriveFileId: driveFileId,
  };
}
