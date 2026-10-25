import {contentDriveVideo} from './driveVideo';
import {getGoogleAccessToken} from '../firebase/googleAccessToken';
/** Fail closed: a viewer never receives an unrestricted Drive player by accident. */
export async function protectedDrivePlayer(item:Record<string,any>,fetcher:typeof fetch=fetch,tokenProvider=getGoogleAccessToken){
 const video=contentDriveVideo(item);if(!video)throw new Error('This resource is not a Drive video.');
 const permitted=item.downloadAllowed===true&&item.downloadPermissionConfirmed===true;
 const token=await tokenProvider(['https://www.googleapis.com/auth/drive']);
 const headers={Authorization:'Bearer '+token};
 const base='https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(video.id);
 const fields='mimeType,trashed,copyRequiresWriterPermission';
 const read=()=>fetcher(base+'?supportsAllDrives=true&fields='+encodeURIComponent(fields),{headers,redirect:'error',signal:AbortSignal.timeout(10000)});
 let response=await read();if(!response.ok)throw new Error('Video protection could not be verified. The owner must share this file with the site service account.');
 let metadata=await response.json() as any;
 if(metadata.trashed||!metadata.mimeType?.startsWith('video/'))throw new Error('This video is unavailable.');
 if(metadata.copyRequiresWriterPermission!==!permitted){
  const update=await fetcher(base+'?supportsAllDrives=true',{method:'PATCH',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({copyRequiresWriterPermission:!permitted}),redirect:'error',signal:AbortSignal.timeout(10000)});
  if(!update.ok)throw new Error('Playback is paused until the file owner disables viewer downloads in Google Drive sharing settings. The site could not apply this restriction.');
  response=await read();if(!response.ok)throw new Error('Video protection could not be verified.');metadata=await response.json();
  if(metadata.copyRequiresWriterPermission!==!permitted)throw new Error('Video download permission could not be verified.');
 }
 return {url:video.previewUrl,downloadAllowed:permitted,downloadUrl:permitted?video.viewUrl:undefined};
}
