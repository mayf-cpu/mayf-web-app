import test from 'node:test';
import assert from 'node:assert/strict';
import {addClassification,defaultClassification} from '../src/lib/cms/classificationSettings';
import {toggleContentGrade} from '../src/lib/cms/contentClassification';
import {protectedDrivePlayer} from '../src/lib/media/protectedDriveVideo';
import {publicContent} from '../src/lib/catalogue/catalogueAccess';
import {downloadableCmsPdfFile} from '../src/lib/download/cmsDownloadResolver';
test('custom grades and subject-specific topics persist in configuration without changing existing choices',()=>{
 const defaults=defaultClassification();let next=addClassification(defaults,{kind:'grade',name:'Class 12'});
 next=addClassification(next,{kind:'subcategory',subject:'Algebra',name:'Matrices'});
 assert.ok(next.grades.includes('Class 12'));assert.ok(next.subjects.Algebra.includes('Matrices'));assert.ok(!next.subjects.Geometry.includes('Matrices'));assert.deepEqual(defaults,defaultClassification());
 assert.deepEqual(toggleContentGrade(['Class 12'],'Class 7'),['Class 12','Class 7']);
 assert.deepEqual(addClassification(next,{kind:'grade',name:'class 12'}),next);
 for(const name of ['','<script>','__proto__','a'.repeat(81)])assert.throws(()=>addClassification(next,{kind:'grade',name}));
 assert.throws(()=>addClassification(next,{kind:'subcategory',subject:'Missing',name:'Topic'}));
});
test('Drive playback restricts legacy default-true downloads and verifies the saved restriction',async()=>{
 let restricted=false;const calls:any[]=[];const fake=async(url:any,options:any)=>{assert.equal(options.redirect,'manual');calls.push({url,options});if(options.method==='PATCH'){restricted=JSON.parse(options.body).copyRequiresWriterPermission;return Response.json({});}return Response.json({mimeType:'video/mp4',copyRequiresWriterPermission:restricted});};
 const item={id:'v',contentType:'video',sourceDriveId:'source_file_id',downloadAllowed:true};
 const result=await protectedDrivePlayer(item,fake as any,async()=> 'credential');assert.equal(result.downloadAllowed,false);assert.equal(result.downloadUrl,undefined);assert.equal(restricted,true);assert.equal(calls.length,3);
 assert.equal(publicContent({...item,accessType:'free'}).embedUrl,'');assert.equal(publicContent({...item,accessType:'free'}).sourceDriveId,undefined);
 const allowed=await protectedDrivePlayer({...item,downloadPermissionConfirmed:true},fake as any,async()=> 'credential');assert.equal(allowed.downloadAllowed,true);assert.ok(allowed.downloadUrl);assert.equal(restricted,false);
});
test('Drive playback fails closed for missing access, failed restriction updates, or unverified writes',async()=>{
 const item={contentType:'facebook',sourceDriveId:'source_file_id'};
 await assert.rejects(protectedDrivePlayer(item,(async()=>Response.json({}, {status:403})) as any,async()=> 'token'),/could not be verified/);
 await assert.rejects(protectedDrivePlayer(item,(async(_u:any,o:any)=>o.method==='PATCH'?Response.json({}, {status:403}):Response.json({mimeType:'video/mp4',copyRequiresWriterPermission:false})) as any,async()=> 'token'),/Playback is paused/);
 await assert.rejects(protectedDrivePlayer(item,(async()=>Response.json({mimeType:'video/mp4',copyRequiresWriterPermission:false})) as any,async()=> 'token'),/could not be verified/);
});
test('old automatically enabled PDF downloads require new explicit owner permission',()=>{
 const item={id:'test',contentType:'pdf',visible:true,status:'published',accessType:'free',downloadAllowed:true,files:[{url:'r2://mayf-study-materials/pdf/test.pdf'}]};
 assert.equal(downloadableCmsPdfFile(item),null);assert.equal(publicContent(item).downloadAllowed,false);
});

test('disabled Drive API is distinguished from file-sharing failures without exposing provider details',async()=>{
 await assert.rejects(protectedDrivePlayer({contentType:'video',sourceDriveId:'source_file_id'},(async()=>Response.json({error:{details:[{reason:'SERVICE_DISABLED',metadata:{private:'not exposed'}}]}},{status:403})) as any,async()=> 'token'),/Google Drive API is disabled/);
});
