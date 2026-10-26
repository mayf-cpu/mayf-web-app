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

import {configurePdfBucket} from '../src/lib/download/pdfObjectStorage';
const id='cms-video';const key='media/'+id+'/'+'a'.repeat(64)+'.mp4';
const item={id,contentType:'video',sourceDriveId:'must_not_be_used',files:[{url:'r2://mayf-study-materials/'+key,mimeType:'video/mp4'}]};
function storage(bytes:Uint8Array,size=bytes.length){configurePdfBucket({head:async()=>({size}),get:async(_key,options)=>({size,body:new Response(Buffer.from(options?bytes.slice(options.range.offset,options.range.offset+options.range.length):bytes)).body})});}
test('stored playback remains independent of Google Drive and returns only MAYF URLs',async t=>{
 storage(new Uint8Array([1,2,3,4]));t.mock.method(globalThis,'fetch',async()=>{throw new Error('Drive must not be contacted during playback');});
 try{const player=await protectedDrivePlayer(item);assert.equal(player.url,'/api/videos/cms-video/media');assert.equal(player.downloadAllowed,false);assert.doesNotMatch(JSON.stringify(player),/drive.google|must_not_be_used|r2:/);
 const chunk=await privateVideoChunk(item,'bytes=1-2');assert.deepEqual([...chunk.bytes],[2,3]);assert.equal(chunk.mimeType,'video/mp4');
 }finally{configurePdfBucket(null);}
});
test('stored playback rejects cross-content keys, missing storage, incomplete bytes and unauthorized downloads',async()=>{
 configurePdfBucket(null);await assert.rejects(protectedDrivePlayer(item),/storage is unavailable/);
 storage(new Uint8Array([1,2,3]),4);await assert.rejects(privateVideoChunk(item),/Incomplete/);
 await assert.rejects(privateVideoChunk({...item,id:'different-content'}),/Invalid stored/);
 await assert.rejects(privateVideoDownload(item),/not permitted/);configurePdfBucket(null);
});
import {privateVideoDownload} from '../src/lib/media/privateVideoMedia';
test('explicitly permitted downloads stream the full stored file',async()=>{
 storage(new Uint8Array([1,2,3,4]));try{const result=await privateVideoDownload({...item,downloadAllowed:true,downloadPermissionConfirmed:true});assert.equal(result.size,4);assert.equal((await new Response(result.body).arrayBuffer()).byteLength,4);}finally{configurePdfBucket(null);}
});
