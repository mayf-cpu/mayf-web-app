import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
const fields=['approval_status','content_id','title','class','category','content_type','drive_file_id','download_allowed','short_description','description','topic','tags','seo_title','seo_description','revision','rejection_notes','regeneration_status','regeneration_error','last_attempt_at','import_status','import_error','last_imported_at','status','firestore_id'];
function fixture(approval:string){
 const original={approval_status:approval,content_id:'resource-1',title:'Fractions',class:'Class 5',category:'Fractions',content_type:'pdf',drive_file_id:'unchanged-source',download_allowed:false,revision:1,rejection_notes:'Explain more clearly'};
 const grid:any[][]=[fields,fields.map(k=>(original as any)[k]??'')];const history:any[][]=[];
 const sheet={getLastColumn:()=>fields.length,getDataRange:()=>({getValues:()=>grid.map(r=>[...r])}),getRange:(row:number,col:number,rows=1,cols=1)=>{const range:any={getDisplayValues:()=>grid.slice(row-1,row-1+rows).map(r=>r.slice(col-1,col-1+cols).map(String)),getValues:()=>grid.slice(row-1,row-1+rows).map(r=>r.slice(col-1,col-1+cols)),setNumberFormat:()=>range,setValue:(value:any)=>{grid[row-1][col-1]=value;}};return range;}};
 const book={getSheetByName:(name:string)=>name==='Content Registry'?sheet:{getLastRow:()=>history.length,appendRow:(r:any[])=>history.push(r)}};
 const context=vm.createContext({SpreadsheetApp:{getActive:()=>book,openById:()=>book,flush:()=>{}},PropertiesService:{getScriptProperties:()=>({getProperty:()=>''})},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},Utilities:{getUuid:()=> 'stable-id'}});
 vm.runInContext(readFileSync(new URL('../google-apps-script/Editorial.gs',import.meta.url),'utf8'),context);
 const row=()=>Object.fromEntries(fields.map((k,i)=>[k,grid[1][i]]));return{context,history,row,grid};
}
test('rejection saves the original, regenerates only text and returns Pending without importing',()=>{
 const f=fixture('Rejected');const calls:string[]=[];f.context.editorialRequest_=(action:string)=>{calls.push(action);return{revision:Object.fromEntries(['title','short_description','description','topic','tags','seo_title','seo_description'].map(k=>[k,'Revised '+k]))};};
 f.context.processEditorialQueue();const result=f.row();assert.deepEqual(calls,['regenerate']);assert.equal(result.approval_status,'Pending');assert.equal(result.revision,2);assert.equal(result.import_status,'PENDING');assert.equal(result.drive_file_id,'unchanged-source');assert.equal(result.download_allowed,false);assert.equal(JSON.parse(f.history[1][4]).title,'Fractions');
});
test('AI failure leaves original rejected text intact and does not endlessly retry',()=>{
 const f=fixture('Rejected');let calls=0;f.context.editorialRequest_=()=>{calls++;throw new Error('Provider unavailable');};f.context.processEditorialQueue();f.context.processEditorialQueue();assert.equal(calls,1);assert.equal(f.row().title,'Fractions');assert.equal(f.row().approval_status,'Rejected');assert.equal(f.row().regeneration_status,'FAILED');
});
test('pending rows never call the website; approved rows record truthful success without duplicate imports',()=>{
 const pending=fixture('Pending');pending.context.editorialRequest_=()=>{throw new Error('Must not be called');};pending.context.processEditorialQueue();
 const f=fixture('Approved');let calls=0;f.context.editorialRequest_=(action:string)=>{assert.equal(action,'import');calls++;return{results:[{firestore_id:'cnt-resource-1',last_imported_at:'2026-10-26T12:00:00Z'}]};};f.context.processEditorialQueue();f.context.processEditorialQueue();assert.equal(calls,1);assert.equal(f.row().approval_status,'Approved');assert.equal(f.row().import_status,'SUCCESS');assert.equal(f.row().firestore_id,'cnt-resource-1');
});
test('concurrent manual edits are not overwritten by regenerated text',()=>{
 const f=fixture('Rejected');f.context.editorialRequest_=()=>{f.grid[1][fields.indexOf('title')]='Teacher edited';return{revision:{title:'AI edited'}};};f.context.processEditorialQueue();assert.equal(f.row().title,'Teacher edited');assert.equal(f.row().regeneration_status,'FAILED');
});
