export function driveVideo(source:string){
 const value=source?.trim(); if(!value)return null;
 let id='';let resourceKey='';
 if(/^[A-Za-z0-9_-]{5,200}$/.test(value))id=value;
 else try{
  const url=new URL(value);
  if(url.protocol!=='https:'||url.hostname!=='drive.google.com'||url.username||url.password||url.port)return null;
  const match=url.pathname.match(/^\/file\/d\/([A-Za-z0-9_-]{5,200})(?:\/(?:view|preview))?\/?$/);
  id=match?.[1]||(['/open','/uc'].includes(url.pathname)?url.searchParams.get('id')||'':'');
  resourceKey=url.searchParams.get('resourcekey')||'';
 }catch{return null;}
 if(!/^[A-Za-z0-9_-]{5,200}$/.test(id))return null;
 const suffix=/^[A-Za-z0-9_-]{1,200}$/.test(resourceKey)?'?resourcekey='+resourceKey:'';
 return {id,previewUrl:`https://drive.google.com/file/d/${id}/preview${suffix}`,viewUrl:`https://drive.google.com/file/d/${id}/view${suffix}`};
}
export function contentDriveVideo(item:{contentType?:string;sourceDriveId?:string;sourceDriveFileId?:string;embedUrl?:string;files?:{url:string}[]}){
 if(!['video','facebook','reel'].includes(item.contentType||''))return null;
 // A real playable media URL takes priority over an old source/audit ID.
 const explicit=item.embedUrl||item.files?.[0]?.url||'';
 return explicit?driveVideo(explicit):driveVideo(item.sourceDriveId||item.sourceDriveFileId||'');
}
