import {getAdminFirestore} from '../firebase/admin';
import {IngestionLock} from './ingestionLock';
import {driveVideo} from '../media/driveVideo';
import {copyDriveFileToProductionStorage} from './driveStorageAdapter';
/** Migrate only the source already saved on this CMS item; never accept a caller-supplied Drive ID. */
export async function storeExistingContent(id:string,db=getAdminFirestore(),transfer=copyDriveFileToProductionStorage){
 if(!db)throw new Error('Content storage is unavailable.');
 const lease=await new IngestionLock(db).acquire('website-storage:'+id);
 try{
  const doc=await db.collection('contentItems').doc(id).get();if(!doc.exists||!doc.updateTime)throw new Error('Content not found.');
  const item={...doc.data(),id} as Record<string,any>;
  const supported=['video','facebook','reel','singleImage','multiImage','pdf'].includes(item.contentType);
  if(item.isDeleted)throw new Error('Archived content cannot be imported.');
  if(!supported)throw new Error('This content type does not support Drive file import.');
  const current=Array.isArray(item.files)?item.files:[];
  if(current.length&&current.every((f:any)=>typeof f.url==='string'&&f.url.startsWith('r2://mayf-study-materials/')))return item;
  const explicit=item.embedUrl||current[0]?.url||'';
  const source=driveVideo(explicit||item.sourceDriveId||item.sourceDriveFileId||'');
  // Keep every saved attachment in order. Never replace a mixed gallery with a single fallback source.
  const sourceFiles=current.length?current:source?[{url:source.previewUrl}]:[];
  if(sourceFiles.some((f:any)=>typeof f.url!=='string'||(!f.url.startsWith('r2://mayf-study-materials/')&&!driveVideo(f.url))))throw new Error('An attachment has no supported saved source; content was not switched.');
  if(!sourceFiles.length)throw new Error('No saved Drive file source was found on this content item.');
  const files=[];let thumbnail:string|undefined;let index=0;
  for(const file of sourceFiles){
   if(file.url.startsWith('r2://mayf-study-materials/')){files.push(file);continue;}
   await lease.renew();
   const result=await transfer(driveVideo(file.url)!.id,index===0?driveVideo(item.thumbnail||'')?.id:undefined,item.slug||id,item.contentType,item.accessType,id);
   if(result.productionThumbnailUrl)thumbnail=result.productionThumbnailUrl;index++;
   files.push({name:file.name||item.title||'Study material',url:result.productionFileUrl,sizeBytes:result.fileSizeBytes,mimeType:result.mimeType});
  }
  await lease.assertOwner();const now=new Date().toISOString();
  const patch={files,embedUrl:'',importStatus:'stored',lastSync:now,updatedAt:now,...(thumbnail?{thumbnail}:{})};
  await db.commit([{collection:'contentItems',id,data:{...item,...patch},updateTime:doc.updateTime,updateMask:Object.keys(patch)}]);
  return {...item,...patch};
 }finally{await lease.release();}
}
