import {storedVideoInfo} from './storedMedia';
/** Playback resolves only private website storage, never the original Drive source. */
export async function protectedDrivePlayer(item:Record<string,any>){
 const permitted=item.downloadAllowed===true&&item.downloadPermissionConfirmed===true;
 await storedVideoInfo(item);const url='/api/videos/'+encodeURIComponent(item.id)+'/media';
 return {url,downloadAllowed:permitted,downloadUrl:permitted?url+'?download=1':undefined};
}
