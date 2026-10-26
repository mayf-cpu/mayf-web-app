import {protectedDriveSource} from './protectedDriveVideo';
import {canReadPremiumContent} from '../catalogue/catalogueAccess';
import type {TokenVerificationResult} from '../firebase/admin';
import {getGoogleAccessToken} from '../firebase/googleAccessToken';
export const VIDEO_CHUNK_BYTES=4*1024*1024;
export function videoRange(header:string|undefined,size:number){
 if(!Number.isSafeInteger(size)||size<=0)throw new Error('Video size is unavailable.');
 if(!header)return {start:0,end:Math.min(size,VIDEO_CHUNK_BYTES)-1};
 const match=header.match(/^bytes=(\d*)-(\d*)$/);if(!match||(!match[1]&&!match[2]))throw new Error('Invalid video byte range.');
 let start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));
 let end=match[1]?(match[2]?Number(match[2]):size-1):size-1;
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start)throw new Error('Invalid video byte range.');
 return {start,end:Math.min(end,size-1,start+VIDEO_CHUNK_BYTES-1)};
}
export function videoAccess(item:Record<string,any>|undefined,verified:TokenVerificationResult|null,download=false){
 if(!item||item.isDeleted||item.visible!==true||(item.status&&item.status!=='published'))return false;
 if(item.accessType!=='free'&&!canReadPremiumContent(verified,item.annualPassIncluded))return false;
 return !download||(item.downloadAllowed===true&&item.downloadPermissionConfirmed===true);
}
export function videoSessionCookie(header:string|undefined){
 const value=header?.split(';').map(x=>x.trim()).find(x=>x.startsWith('mayf_video_session='))?.slice('mayf_video_session='.length)||'';
 return value.length<=5000&&/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value)?'Bearer '+value:undefined;
}
/** Only validated ranges of the configured Drive source are buffered; no provider redirects or URLs reach clients. */
export async function privateVideoChunk(item:Record<string,any>,rangeHeader?:string,fetcher:typeof fetch=fetch,tokenProvider=getGoogleAccessToken){
 const source=await protectedDriveSource(item,fetcher,tokenProvider);
 if(source.metadata.capabilities?.canDownload===false)throw new Error('The site needs permission to read the original video for private playback.');
 const size=Number(source.metadata.size);const {start,end}=videoRange(rangeHeader,size);
 const response=await fetcher('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(source.video.id)+'?alt=media&supportsAllDrives=true',{headers:{Authorization:'Bearer '+source.token,Range:'bytes='+start+'-'+end},redirect:'manual',signal:AbortSignal.timeout(20000)});
 const expected=end-start+1;
 if(response.status!==206||response.headers.get('content-range')!=='bytes '+start+'-'+end+'/'+size||!response.body)throw new Error('The video provider could not deliver a verified byte range.');
 if(response.headers.has('content-length')&&Number(response.headers.get('content-length'))!==expected)throw new Error('Invalid video range length.');
 const reader=response.body.getReader();const chunks:Uint8Array[]=[];let length=0;
 try{while(true){const part=await reader.read();if(part.done)break;length+=part.value.length;if(length>expected)throw new Error('Video response exceeded its permitted byte range.');chunks.push(part.value);}}
 catch(e){await reader.cancel().catch(()=>{});throw e;}
 if(length!==expected)throw new Error('Incomplete video range.');
 const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 const mimeType=String(source.metadata.mimeType);if(!/^video\/[a-zA-Z0-9.+-]+$/.test(mimeType))throw new Error('Invalid video type.');
 return {bytes,mimeType,start,end,size};
}
/** Explicitly permitted downloads stream the original file without buffering it in Worker memory. */
export async function privateVideoDownload(item:Record<string,any>,fetcher:typeof fetch=fetch,tokenProvider=getGoogleAccessToken){
 if(item.downloadAllowed!==true||item.downloadPermissionConfirmed!==true)throw new Error('Downloads are not permitted.');
 const source=await protectedDriveSource(item,fetcher,tokenProvider);
 const size=Number(source.metadata.size);const mimeType=String(source.metadata.mimeType);
 if(!Number.isSafeInteger(size)||size<=0||!/^video\/[a-zA-Z0-9.+-]+$/.test(mimeType))throw new Error('Video metadata is unavailable.');
 const response=await fetcher('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(source.video.id)+'?alt=media&supportsAllDrives=true',{headers:{Authorization:'Bearer '+source.token},redirect:'manual',signal:AbortSignal.timeout(120000)});
 if(response.status!==200||!response.body||Number(response.headers.get('content-length'))!==size)throw new Error('The video provider could not deliver the complete file.');
 return {body:response.body,size,mimeType};
}
