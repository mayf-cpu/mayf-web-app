import test from 'node:test';import assert from 'node:assert/strict';
import {storeExistingContent} from '../src/lib/ingestion/storeExistingContent';
function database(item:any){let revision=1;const docs=new Map<string,any>([['contentItems/item',{data:item,revision:1}]]);return {docs,db:{collection:(collection:string)=>({doc:(id:string)=>({get:async()=>{const row=docs.get(collection+'/'+id);return{exists:!!row,updateTime:row?'r'+row.revision:undefined,data:()=>structuredClone(row?.data)};}})}),commit:async(changes:any[])=>{for(const c of changes){const old=docs.get(c.collection+'/'+c.id);if(c.updateTime?(old?'r'+old.revision:'')!==c.updateTime:!!old)throw new Error('revision conflict');}for(const c of changes){const key=c.collection+'/'+c.id;if(c.data)docs.set(key,{data:structuredClone(c.data),revision:++revision});else docs.delete(key);}}} as any};}
const item={id:'item',title:'Existing lesson',slug:'lesson',contentType:'video',accessType:'free',visible:true,status:'published',sourceDriveId:'original_drive_id',files:[],downloadAllowed:false};
test('existing content switches to storage only after a verified copy and repeated imports are idempotent',async()=>{
 const {db,docs}=database(item);let copies=0;const transfer=async()=>{copies++;return {productionFileUrl:'r2://mayf-study-materials/media/item/'+'a'.repeat(64)+'.mp4',fileSizeBytes:20,mimeType:'video/mp4'};};
 const stored=await storeExistingContent('item',db,transfer as any);assert.equal(stored.downloadAllowed,false);assert.equal(stored.sourceDriveId,'original_drive_id');assert.equal(stored.status,'published');assert.equal(stored.files[0].sizeBytes,20);
 await storeExistingContent('item',db,transfer as any);assert.equal(copies,1);assert.equal(docs.get('contentItems/item').data.embedUrl,'');
});
test('failed uploads and competing admin edits leave the original pointer intact',async()=>{
 const first=database(item);await assert.rejects(storeExistingContent('item',first.db,(async()=>{throw new Error('upload failed');}) as any),/upload failed/);assert.deepEqual(first.docs.get('contentItems/item').data.files,[]);
 const second=database(item);await assert.rejects(storeExistingContent('item',second.db,(async()=>{second.docs.set('contentItems/item',{data:{...item,status:'hidden',visible:false},revision:999});return{productionFileUrl:'r2://verified',fileSizeBytes:20,mimeType:'video/mp4'};}) as any),/revision conflict/);assert.equal(second.docs.get('contentItems/item').data.visible,false);assert.deepEqual(second.docs.get('contentItems/item').data.files,[]);
});
