import {storedVideo} from '../media/storedMedia';
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
  if(drive || storedVideo(item)) {publicItem.embedUrl="";publicItem.files=[];publicItem.protectedDriveVideo=true;}
  if(['singleImage','multiImage'].includes(item.contentType)&&Array.isArray(item.files))publicItem.files=item.files.map((file:any,index:number)=>({...file,url:typeof file.url==='string'&&file.url.startsWith('r2://mayf-study-materials/media/')?'/api/assets/'+encodeURIComponent(item.id)+'/'+index:file.url}));
  if(typeof item.thumbnail==='string'&&item.thumbnail.startsWith('r2://mayf-study-materials/media/'))publicItem.thumbnail='/api/assets/'+encodeURIComponent(item.id)+'/thumbnail';
  publicItem.downloadAllowed = Boolean(downloadableCmsPdfFile(item));
  if (item.accessType !== 'free' && !canAccess) {
    publicItem.files = [];
    publicItem.embedUrl = '';
    publicItem.galleryImages = [];
  }
  return publicItem;
}
