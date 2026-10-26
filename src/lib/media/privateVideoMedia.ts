import {storedVideoInfo} from './storedMedia';
import {canReadPremiumContent} from '../catalogue/catalogueAccess';
import type {TokenVerificationResult} from '../firebase/admin';
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
/** Only validated ranges of the private website-storage object are buffered; no provider redirects or URLs reach clients. */
export async function privateVideoChunk(item:Record<string,any>,rangeHeader?:string){
 const source=await storedVideoInfo(item);
 const size=source.size;const {start,end}=videoRange(rangeHeader,size);
 const object=await source.bucket.get(source.key,{range:{offset:start,length:end-start+1}});
 if(!object?.body)throw new Error('Stored video could not be read.');
 const expected=end-start+1;
 const reader=object.body.getReader();const chunks:Uint8Array[]=[];let length=0;
 try{while(true){const part=await reader.read();if(part.done)break;length+=part.value.length;if(length>expected)throw new Error('Video response exceeded its permitted byte range.');chunks.push(part.value);}}
 catch(e){await reader.cancel().catch(()=>{});throw e;}
 if(length!==expected)throw new Error('Incomplete video range.');
 const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 const mimeType=source.mimeType;if(!/^video\/[a-zA-Z0-9.+-]+$/.test(mimeType))throw new Error('Invalid video type.');
 return {bytes,mimeType,start,end,size};
}
/** Explicitly permitted downloads stream the original file without buffering it in Worker memory. */
export async function privateVideoDownload(item:Record<string,any>){
 if(item.downloadAllowed!==true||item.downloadPermissionConfirmed!==true)throw new Error('Downloads are not permitted.');
 const source=await storedVideoInfo(item);
 const object=await source.bucket.get(source.key);if(!object?.body)throw new Error('Stored video is unavailable.');
 return {body:object.body,size:source.size,mimeType:source.mimeType};
}
