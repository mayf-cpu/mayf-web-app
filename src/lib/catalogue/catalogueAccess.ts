import firebaseConfig from '../../config/firebasePublicConfig.json';
import type { TokenVerificationResult } from '../firebase/admin';
export function canReadPremiumContent(verified: TokenVerificationResult | null, annualPassIncluded: boolean, now = Date.now()): boolean {
  if (!verified?.valid) return false;
  const activePass = Boolean(verified.annualPass && (!verified.annualPassExpiry || new Date(verified.annualPassExpiry).getTime() >= now));
  return Boolean(verified.admin || verified.superAdmin || verified.pro || (annualPassIncluded && activePass));
}
export function publicContent(item: Record<string, any>, canAccess = false): Record<string, any> {
  const { sourceDriveId, sourceDriveFileId, sales, archivedBy, archivedReason, ...publicItem } = item;
  const bucket = process.env.PRODUCTION_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket;
  if (typeof publicItem.thumbnail === 'string' && publicItem.thumbnail.startsWith(`https://storage.googleapis.com/${bucket}/`)) publicItem.thumbnail = `/api/catalogue/thumbnail/${encodeURIComponent(item.id)}`;
  if (item.accessType !== 'free' && !canAccess) {
    publicItem.files = [];
    publicItem.embedUrl = '';
    publicItem.galleryImages = [];
  }
  return publicItem;
}
