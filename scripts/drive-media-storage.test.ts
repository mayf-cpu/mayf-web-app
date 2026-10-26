import test from 'node:test';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {copyDriveMedia} from '../src/lib/ingestion/driveMediaStorage';import {configurePdfBucket} from '../src/lib/download/pdfObjectStorage';
const bytes=Uint8Array.from([0,0,0,24,102,116,121,112,105,115,111,109,0,0,0,0,1,2,3,4]);
test('Drive video bytes are copied to verified private storage with a checksum; repeated imports reuse the object',async()=>{
 const md5=crypto.createHash('md5').update(bytes).digest('hex');const objects=new Map<string,Uint8Array>();let writes=0;const calls:string[]=[];
 configurePdfBucket({head:async key=>objects.has(key)?{size:objects.get(key)!.length}:null,get:async()=>null,put:async(key,value,options)=>{assert.equal(options?.md5,md5);writes++;objects.set(key,new Uint8Array(await new Response(value as any).arrayBuffer()));}});
 const request=async(url:any,options:any)=>{calls.push(String(url));assert.equal(options.redirect,'manual');return !String(url).includes('alt=media')?Response.json({mimeType:'video/mp4',size:bytes.length,md5Checksum:md5}):options.headers.Range?new Response(bytes.slice(0,16),{status:206,headers:{'Content-Range':'bytes 0-15/'+bytes.length}}):new Response(bytes,{headers:{'Content-Length':String(bytes.length)}});};
 try{const a=await copyDriveMedia('source_video_id','cms-video','video',request as any,async()=> 'server-only-token');const b=await copyDriveMedia('source_video_id','cms-video','video',request as any,async()=> 'server-only-token');assert.match(a.productionFileUrl,/^r2:\/\/mayf-study-materials\/media\/cms-video\/[a-f0-9]{64}\.mp4$/);assert.equal(a.productionFileUrl,b.productionFileUrl);assert.equal(writes,1);assert.deepEqual([...objects.values()][0],bytes);assert.ok(calls.some(x=>x.includes('alt=media')));}finally{configurePdfBucket(null);}
});
test('invalid media, redirects, excessive sizes, missing checksums and unverified writes cannot be published',async()=>{
 configurePdfBucket({head:async()=>null,get:async()=>null,put:async()=>{}});
 try{for(const metadata of [{mimeType:'text/html',size:20,md5Checksum:'a'.repeat(32)},{mimeType:'video/mp4',size:600*1024*1024,md5Checksum:'a'.repeat(32)},{mimeType:'video/mp4',size:20}])await assert.rejects(copyDriveMedia('source_video_id','cms-video','video',(async()=>Response.json(metadata)) as any,async()=> 'token'));
 await assert.rejects(copyDriveMedia('source_video_id','cms-video','video',(async()=>new Response(null,{status:302})) as any,async()=> 'token'),/unavailable/);
 const request=async(url:any,o:any)=>!String(url).includes('alt=media')?Response.json({mimeType:'video/mp4',size:20,md5Checksum:'a'.repeat(32)}):o.headers.Range?new Response(bytes.slice(0,16),{status:206,headers:{'Content-Range':'bytes 0-15/20'}}):new Response(bytes,{headers:{'Content-Length':'20'}});
 await assert.rejects(copyDriveMedia('source_video_id','cms-video','video',request as any,async()=> 'token'),/verification failed/);
 }finally{configurePdfBucket(null);}
});
test('image imports preserve verified image bytes and private catalogue projection uses website asset URLs',async()=>{
 const {publicContent}=await import('../src/lib/catalogue/catalogueAccess');const image=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0,0,0,0,0,1,2,3,4]);const digest=crypto.createHash('md5').update(image).digest('hex');const objects=new Map<string,Uint8Array>();
 configurePdfBucket({head:async key=>objects.has(key)?{size:objects.get(key)!.length}:null,get:async()=>null,put:async(key,value)=>{objects.set(key,new Uint8Array(await new Response(value as any).arrayBuffer()));}});
 const request=async(url:any,o:any)=>!String(url).includes('alt=media')?Response.json({mimeType:'image/png',size:20,md5Checksum:digest}):o.headers.Range?new Response(image.slice(0,16),{status:206,headers:{'Content-Range':'bytes 0-15/20'}}):new Response(image,{headers:{'Content-Length':'20'}});
 try{const result=await copyDriveMedia('source_image_id','image-item','image',request as any,async()=> 'token');const stored={id:'image-item',contentType:'singleImage',visible:true,status:'published',accessType:'paid',files:[{url:result.productionFileUrl,mimeType:result.mimeType}]};assert.deepEqual(publicContent(stored).files,[]);assert.equal(publicContent(stored,true).files[0].url,'/api/assets/image-item/0');assert.equal(objects.size,1);}finally{configurePdfBucket(null);}
});
