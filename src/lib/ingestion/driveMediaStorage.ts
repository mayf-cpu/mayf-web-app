import crypto from 'node:crypto';
import {getPdfBucket} from '../download/pdfObjectStorage';
import {getGoogleAccessToken} from '../firebase/googleAccessToken';
import {MEDIA_TYPES} from '../media/storedMedia';
import {driveVideo} from '../media/driveVideo';
/** Original bytes are streamed to private R2; publishing follows a verified object write only. */
export async function copyDriveMedia(source:string,contentId:string,expected:'video'|'image',request:typeof fetch=fetch,tokenProvider=getGoogleAccessToken){
 const id=driveVideo(source)?.id;if(!id||!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,149}$/.test(contentId))throw new Error('Invalid source or content ID.');
 const bucket=getPdfBucket();if(!bucket?.put)throw new Error('Private website storage is unavailable.');
 const token=await tokenProvider(['https://www.googleapis.com/auth/drive.readonly']);
 const headers={Authorization:'Bearer '+token};const base='https://www.googleapis.com/drive/v3/files/'+id;
 const response=await request(base+'?supportsAllDrives=true&fields=id,name,mimeType,size,md5Checksum,version,trashed',{headers,redirect:'manual',signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw new Error('Drive source is unavailable ('+response.status+').');
 const metadata=await response.json() as any;const mime=String(metadata.mimeType);const size=Number(metadata.size);const ext=MEDIA_TYPES[mime];
 const max=expected==='video'?512*1024*1024:20*1024*1024;
 if(metadata.trashed||!ext||!mime.startsWith(expected+'/')||!Number.isSafeInteger(size)||size<=12||size>max)throw new Error('Unsupported file type or size. Videos support MP4/WebM up to 512 MiB; images support PNG/JPEG/WebP/GIF up to 20 MiB.');
 const md5=typeof metadata.md5Checksum==='string'&&/^[a-f0-9]{32}$/.test(metadata.md5Checksum)?metadata.md5Checksum:undefined;
 if(!md5)throw new Error('Drive did not provide a source checksum.');
 const version=crypto.createHash('sha256').update(id+':'+md5+':'+size).digest('hex');const key='media/'+contentId+'/'+version+'.'+ext;
 const existing=await bucket.head(key);
 if(existing?.size!==size){
  // Verify container signatures using a tiny range without buffering the original file.
  const probe=await request(base+'?alt=media&supportsAllDrives=true',{headers:{...headers,Range:'bytes=0-15'},redirect:'manual',signal:AbortSignal.timeout(10000)});
  if(probe.status!==206||probe.headers.get('content-range')!=='bytes 0-15/'+size)throw new Error('Drive could not verify the file header.');
  const initialReader=probe.body?.getReader();if(!initialReader)throw new Error('Empty file header.');const chunks:Uint8Array[]=[];let length=0;
  try{while(true){const part=await initialReader.read();if(part.done)break;length+=part.value.length;if(length>16)throw new Error('File header exceeded its requested range.');chunks.push(part.value);}}finally{await initialReader.cancel().catch(()=>{});}
  if(length!==16)throw new Error('Incomplete file header.');const header=new Uint8Array(16);let at=0;for(const chunk of chunks){header.set(chunk,at);at+=chunk.length;}
  const ascii=(start:number,end:number)=>String.fromCharCode(...header.slice(start,end));
  const valid=mime==='video/mp4'?ascii(4,8)==='ftyp':mime==='video/webm'?header.slice(0,4).every((v,i)=>v===[0x1a,0x45,0xdf,0xa3][i]):mime==='image/png'?header.slice(0,8).every((v,i)=>v===[137,80,78,71,13,10,26,10][i]):mime==='image/jpeg'?header[0]===255&&header[1]===216&&header[2]===255:mime==='image/webp'?ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP':['GIF87a','GIF89a'].includes(ascii(0,6));
  if(!valid)throw new Error('File bytes do not match the declared media type.');
  const file=await request(base+'?alt=media&supportsAllDrives=true',{headers,redirect:'manual',signal:AbortSignal.timeout(120000)});
  if(file.status!==200||!file.body||Number(file.headers.get('content-length'))!==size)throw new Error('Drive did not return the complete source file.');
  await bucket.put(key,file.body,{httpMetadata:{contentType:mime},md5});
 }
 const stored=await bucket.head(key);if(!stored||stored.size!==size)throw new Error('Website storage verification failed; content was not switched.');
 return {productionFileUrl:'r2://mayf-study-materials/'+key,fileSizeBytes:size,mimeType:mime,sourceDriveFileId:id};
}
