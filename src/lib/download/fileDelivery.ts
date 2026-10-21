import { getGoogleAccessToken } from '../firebase/googleAccessToken';
import firebaseConfig from '../../config/firebasePublicConfig.json';
export type StoredAsset = { name: string; url: string; mimeType: string; sizeBytes?: number };
const defaultHosts = ['firebasestorage.googleapis.com', 'storage.googleapis.com', 'drive.google.com', 'www.w3.org'];
export async function fetchDownloadAsset(asset: StoredAsset): Promise<Buffer> {
  const source = new URL(asset.url);
  const hosts = (process.env.DOWNLOAD_ALLOWED_HOSTS || defaultHosts.join(',')).split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
  if (source.protocol !== 'https:' || source.username || source.password || (source.port && source.port !== '443') || !hosts.includes(source.hostname.toLowerCase())) throw new Error('This file source is not configured for protected downloads.');
  const bucket = process.env.PRODUCTION_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket;
  const ownStorage = source.hostname === 'storage.googleapis.com' && decodeURIComponent(source.pathname.split('/')[1] || '') === bucket;
  const headers: Record<string, string> = {};
  if (ownStorage && (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY)) headers.Authorization = `Bearer ${await getGoogleAccessToken(['https://www.googleapis.com/auth/devstorage.read_only'])}`;
  const response = await fetch(source, { headers, redirect: 'manual', signal: AbortSignal.timeout(15000) });
  if (!response.ok || response.status >= 300) throw new Error('The resource file is unavailable. Check its storage URL and sharing permissions.');
  const maxBytes = 25 * 1024 * 1024;
  if (Number(response.headers.get('content-length')) > maxBytes) throw new Error('File exceeds the 25 MB download limit.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = response.body?.getReader();
  if (!reader) throw new Error('The resource file is empty.');
  try {
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new Error('File exceeds the 25 MB download limit.'); }
      chunks.push(next.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = Buffer.concat(chunks);
  if (!bytes.length) throw new Error('The resource file is empty.');
  if (asset.mimeType === 'application/pdf' && bytes.subarray(0, 5).toString('ascii') !== '%PDF-') throw new Error('The stored file is not a valid PDF. Check the file URL.');
  return bytes;
}
