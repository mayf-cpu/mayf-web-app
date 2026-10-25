import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {driveVideo,contentDriveVideo} from '../src/lib/media/driveVideo';
import {publicContent} from '../src/lib/catalogue/catalogueAccess';
import {DriveVideoViewer} from '../src/components/viewers/DriveVideoViewer';
import {copyDriveFileToProductionStorage} from '../src/lib/ingestion/driveStorageAdapter';
const id='1_example-drive-video-id';
test('Drive IDs and supported file links become players without accepting arbitrary iframe hosts',()=>{
 for(const source of [id,`https://drive.google.com/file/d/${id}/view`,`https://drive.google.com/open?id=${id}`,`https://drive.google.com/file/d/${id}/preview`])assert.equal(driveVideo(source)?.previewUrl,`https://drive.google.com/file/d/${id}/preview`);
 assert.match(driveVideo(`https://drive.google.com/file/d/${id}/view?resourcekey=key_123`)!.previewUrl,/resourcekey=key_123/);
 for(const source of ['javascript:alert(1)',`https://drive.google.com.attacker.test/file/d/${id}/view`,`https://user@drive.google.com/file/d/${id}/view`])assert.equal(driveVideo(source),null);
 assert.equal(contentDriveVideo({contentType:'pdf',sourceDriveId:id}),null);
 assert.equal(contentDriveVideo({contentType:'video',sourceDriveId:id,embedUrl:'https://cdn.example.test/movie.mp4'}),null);
});
test('Facebook-labelled Drive videos use Drive and paid projections still hide playback sources',()=>{
 const item={id:'video-test',contentType:'facebook',sourceDriveId:id,accessType:'paid',files:[]};
 assert.equal(contentDriveVideo(item)?.id,id);
 const locked=publicContent(item);assert.equal(locked.embedUrl,'');assert.equal(locked.sourceDriveId,undefined);
 const unlocked=publicContent(item,true);assert.equal(unlocked.embedUrl,'');assert.equal(unlocked.protectedDriveVideo,true);assert.equal(unlocked.sourceDriveId,undefined);
 assert.equal(publicContent({...item,accessType:'free'}).embedUrl,'');
});
test('Drive video facade is landscape, waits for Play, and includes access/processing guidance',()=>{
 const html=renderToStaticMarkup(React.createElement(DriveVideoViewer,{contentId:id,title:'Landscape lesson'}));
 assert.match(html,/aspect-video/);assert.match(html,/Play video/);assert.doesNotMatch(html,/href=|drive.google.com/);assert.doesNotMatch(html,/<iframe/);
});
test('video imports verify Drive metadata, reject non-videos and failures, and retain original permissions',async t=>{
 const previous=process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
 const {privateKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
 process.env.GOOGLE_SERVICE_ACCOUNT_KEY=JSON.stringify({client_email:'test@example.iam.gserviceaccount.com',private_key:privateKey.export({type:'pkcs8',format:'pem'}).toString()});
 let metadata:any={mimeType:'video/mp4',size:'987654321',resourceKey:'resource_key'};let status=200;const calls:string[]=[];
 t.mock.method(globalThis,'fetch',async(input:any)=>{const url=String(input);calls.push(url);return url.includes('oauth2.googleapis.com')?Response.json({access_token:'test-token'}):Response.json(metadata,{status});});
 try{
  const result=await copyDriveFileToProductionStorage(id,undefined,'lesson','video','paid','cnt-video');
  assert.equal(result.mimeType,'video/mp4');assert.equal(result.fileSizeBytes,987654321);assert.match(result.productionFileUrl,/drive.google.com\/file\/d\/.*\/preview\?resourcekey=resource_key/);
  assert.equal(calls.some(url=>url.includes('alt=media')||url.includes('/permissions')),false);
  metadata={mimeType:'application/pdf'};await assert.rejects(copyDriveFileToProductionStorage(id,undefined,'lesson','video','paid','cnt-video'),/not an available video/);
  metadata={mimeType:'video/mp4',trashed:true};await assert.rejects(copyDriveFileToProductionStorage(id,undefined,'lesson','video','paid','cnt-video'),/not an available video/);
  status=403;await assert.rejects(copyDriveFileToProductionStorage(id,undefined,'lesson','video','paid','cnt-video'),/unavailable \(403\)/);
 }finally{if(previous===undefined)delete process.env.GOOGLE_SERVICE_ACCOUNT_KEY;else process.env.GOOGLE_SERVICE_ACCOUNT_KEY=previous;}
});
