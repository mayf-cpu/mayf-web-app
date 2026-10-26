import test from 'node:test';
import assert from 'node:assert/strict';
import {videoRange,videoAccess,videoSessionCookie,privateVideoChunk,VIDEO_CHUNK_BYTES} from '../src/lib/media/privateVideoMedia';
import {protectedDrivePlayer} from '../src/lib/media/protectedDriveVideo';
test('video ranges are bounded, support seeking and suffixes, and reject multipart or invalid ranges',()=>{
 assert.deepEqual(videoRange(undefined,100),{start:0,end:99});assert.deepEqual(videoRange('bytes=20-30',100),{start:20,end:30});assert.deepEqual(videoRange('bytes=-10',100),{start:90,end:99});assert.equal(videoRange('bytes=0-',10000000).end,VIDEO_CHUNK_BYTES-1);
 for(const value of ['bytes=0-1,2-3','bytes=100-','bytes=20-10','bytes=-','bytes=-0','bytes=NaN-2'])assert.throws(()=>videoRange(value,100));
});
test('every media request rechecks publication, paid access and explicit download permission',()=>{
 const item={visible:true,status:'published',accessType:'paid',annualPassIncluded:true};
 assert.equal(videoAccess(item,null),false);assert.equal(videoAccess({...item,accessType:'free'},null),true);
 const pass={valid:true,annualPass:true,annualPassExpiry:new Date(Date.now()+60000).toISOString()} as any;
 assert.equal(videoAccess(item,pass),true);assert.equal(videoAccess({...item,isDeleted:true},pass),false);assert.equal(videoAccess({...item,visible:false},pass),false);
 assert.equal(videoAccess(item,{...pass,annualPassExpiry:'2020-01-01'}),false);assert.equal(videoAccess({...item,downloadAllowed:true},pass,true),false);assert.equal(videoAccess({...item,downloadAllowed:true,downloadPermissionConfirmed:true},pass,true),true);
 assert.equal(videoSessionCookie('mayf_video_session=one.two.three'),'Bearer one.two.three');assert.equal(videoSessionCookie('mayf_video_session=bad; x=y'),undefined);
});
test('private video delivery returns only verified bounded bytes and never exposes Drive credentials or source URLs',async()=>{
 const item={id:'cms-video',contentType:'video',sourceDriveId:'private_video_id'};
 const calls:any[]=[];
 const fake=async(url:any,options:any)=>{calls.push({url,options});assert.equal(options.redirect,'manual');return String(url).includes('alt=media')?new Response(new Uint8Array([1,2,3,4]),{status:206,headers:{'Content-Range':'bytes 0-3/4','Content-Length':'4'}}):Response.json({mimeType:'video/mp4',size:'4',copyRequiresWriterPermission:true,capabilities:{canDownload:true}});};
 const player=await protectedDrivePlayer(item,fake as any,async()=> 'private-credential');assert.equal(player.url,'/api/videos/cms-video/media');assert.doesNotMatch(JSON.stringify(player),/drive.google|private_video_id|private-credential/);
 const chunk=await privateVideoChunk(item,'bytes=0-',fake as any,async()=> 'private-credential');assert.deepEqual([...chunk.bytes],[1,2,3,4]);assert.equal(chunk.mimeType,'video/mp4');assert.equal(calls.at(-1).options.headers.Range,'bytes=0-3');
 const bad=async(url:any)=>String(url).includes('alt=media')?new Response(new Uint8Array(12),{status:200}):Response.json({mimeType:'video/mp4',size:'4',copyRequiresWriterPermission:true});
 await assert.rejects(privateVideoChunk(item,'bytes=0-',bad as any,async()=> 'token'),/verified byte range/);
});
test('oversized, incomplete and inaccessible source responses fail closed',async()=>{
 const item={id:'cms-video',contentType:'facebook',sourceDriveId:'private_video_id'};
 for(const bytes of [new Uint8Array(5),new Uint8Array(3)]){
 const fake=async(url:any)=>String(url).includes('alt=media')?new Response(bytes,{status:206,headers:{'Content-Range':'bytes 0-3/4'}}):Response.json({mimeType:'video/mp4',size:'4',copyRequiresWriterPermission:true});
 await assert.rejects(privateVideoChunk(item,undefined,fake as any,async()=> 'token'),/exceeded|Incomplete/);
 }
 const denied=async()=>Response.json({mimeType:'video/mp4',size:'4',copyRequiresWriterPermission:true,capabilities:{canDownload:false}});
 await assert.rejects(privateVideoChunk(item,undefined,denied as any,async()=> 'token'),/needs permission/);
});
test('explicit full-file downloads require owner confirmation and a complete verified stream',async()=>{
 const {privateVideoDownload}=await import('../src/lib/media/privateVideoMedia');const base={id:'v',contentType:'video',sourceDriveId:'private_video_id',downloadAllowed:true};
 await assert.rejects(privateVideoDownload(base),/not permitted/);
 const fake=async(url:any)=>String(url).includes('alt=media')?new Response(new Uint8Array([1,2,3,4]),{headers:{'Content-Length':'4'}}):Response.json({mimeType:'video/mp4',size:'4',copyRequiresWriterPermission:false});
 const result=await privateVideoDownload({...base,downloadPermissionConfirmed:true},fake as any,async()=> 'token');assert.equal(result.size,4);assert.equal((await new Response(result.body).arrayBuffer()).byteLength,4);
});
