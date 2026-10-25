import {contentDriveVideo} from '../media/driveVideo';
import type { TokenVerificationResult } from '../firebase/admin';
import { downloadableCmsPdfFile } from '../download/cmsDownloadResolver';
export function canReadPremiumContent(verified: TokenVerificationResult | null, annualPassIncluded: boolean, now = Date.now()): boolean {
  if (!verified?.valid) return false;
  const activePass = Boolean(verified.annualPass && (!verified.annualPassExpiry || new Date(verified.annualPassExpiry).getTime() >= now));
  return Boolean(verified.admin || verified.superAdmin || verified.pro || (annualPassIncluded && activePass));
}
export function publicContent(item: Record<string, any>, canAccess = false): Record<string, any> {
  const { sourceDriveId, sourceDriveFileId, sales, archivedBy, archivedReason, ...publicItem } = item;
  const drive=contentDriveVideo(item);
  if(drive) {publicItem.embedUrl="";publicItem.files=[];publicItem.protectedDriveVideo=true;}
  publicItem.downloadAllowed = Boolean(downloadableCmsPdfFile(item));
  if (item.accessType !== 'free' && !canAccess) {
    publicItem.files = [];
    publicItem.embedUrl = '';
    publicItem.galleryImages = [];
  }
  return publicItem;
}
