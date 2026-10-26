import {getPdfBucket} from '../download/pdfObjectStorage';
const PREFIX='r2://mayf-study-materials/';
export const MEDIA_TYPES:Record<string,string>={'video/mp4':'mp4','video/webm':'webm','image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif'};
export function storedMediaKey(id:string,url:string){
 const key=url.startsWith(PREFIX)?url.slice(PREFIX.length):'';
 if(!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,149}$/.test(id)||!key.startsWith('media/'+id+'/')||!/^media\/[a-zA-Z0-9][a-zA-Z0-9_-]{0,149}\/[a-f0-9]{64}\.(mp4|webm|png|jpg|webp|gif)$/.test(key))throw new Error('Invalid stored media object.');
 return key;
}
export function storedVideo(item:Record<string,any>){
 if(!['video','facebook','reel'].includes(item.contentType))return null;
 const file=item.files?.find((f:any)=>typeof f.url==='string'&&f.url.startsWith(PREFIX+'media/'));
 if(!file)return null;return {file,key:storedMediaKey(item.id,file.url)};
}
export async function storedVideoInfo(item:Record<string,any>){
 const source=storedVideo(item);if(!source)throw new Error('This video has not been imported to website storage.');
 const bucket=getPdfBucket();if(!bucket)throw new Error('Website storage is unavailable.');
 const head=await bucket.head(source.key);if(!head||head.size<=0||!Number.isSafeInteger(head.size))throw new Error('Stored video is unavailable.');
 const mimeType=source.file.mimeType;if(!['video/mp4','video/webm'].includes(mimeType))throw new Error('Unsupported stored video type.');
 return {...source,bucket,size:head.size,mimeType};
}
