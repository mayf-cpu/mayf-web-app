import {contentDriveVideo} from './driveVideo';
import {getGoogleAccessToken} from '../firebase/googleAccessToken';
/** Fail closed: a viewer never receives an unrestricted Drive player by accident. */
export async function protectedDriveSource(item:Record<string,any>,fetcher:typeof fetch=fetch,tokenProvider=getGoogleAccessToken){
 const video=contentDriveVideo(item);if(!video)throw new Error('This resource is not a Drive video.');
 const permitted=item.downloadAllowed===true&&item.downloadPermissionConfirmed===true;
 const token=await tokenProvider(['https://www.googleapis.com/auth/drive']);
 const headers={Authorization:'Bearer '+token};
 const base='https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(video.id);
 const fields='mimeType,size,trashed,copyRequiresWriterPermission,capabilities(canDownload)';
 const read=()=>fetcher(base+'?supportsAllDrives=true&fields='+encodeURIComponent(fields),{headers,redirect:'manual',signal:AbortSignal.timeout(10000)});
 let response=await read();if(!response.ok){
  const problem=await response.json().catch(()=>({})) as any;
  const reasons=[...(problem.error?.errors||[]),...(problem.error?.details||[])].map((entry:any)=>entry.reason);
  if(reasons.includes('SERVICE_DISABLED')||reasons.includes('accessNotConfigured'))throw new Error('Google Drive API is disabled for the site’s Google Cloud project. The administrator must enable it before protected video playback can be verified.');
  throw new Error('Video protection could not be verified (Drive HTTP '+response.status+'). Check the file ID and the site service account’s access to this file.');
 }
 let metadata=await response.json() as any;
 if(metadata.trashed||!metadata.mimeType?.startsWith('video/'))throw new Error('This video is unavailable.');
 if(metadata.copyRequiresWriterPermission!==!permitted){
  const update=await fetcher(base+'?supportsAllDrives=true',{method:'PATCH',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({copyRequiresWriterPermission:!permitted}),redirect:'manual',signal:AbortSignal.timeout(10000)});
  if(!update.ok)throw new Error('Playback is paused until the file owner disables viewer downloads in Google Drive sharing settings. The site could not apply this restriction.');
  response=await read();if(!response.ok)throw new Error('Video protection could not be verified.');metadata=await response.json();
  if(metadata.copyRequiresWriterPermission!==!permitted)throw new Error('Video download permission could not be verified.');
 }
 return {video,token,metadata,permitted};
}

export async function protectedDrivePlayer(item:Record<string,any>,fetcher:typeof fetch=fetch,tokenProvider=getGoogleAccessToken){
 const source=await protectedDriveSource(item,fetcher,tokenProvider);
 const url='/api/videos/'+encodeURIComponent(item.id)+'/media';
 return {url,downloadAllowed:source.permitted,downloadUrl:source.permitted?url+'?download=1':undefined};
}
