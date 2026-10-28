import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRegistryRow,requireApprovedRegistryRow,validateRegeneratedText,EDITORIAL_TEXT_FIELDS,REGISTRY_FORMATS} from '../src/lib/ingestion/editorialRegistry';
const base={content_id:'lesson-1',title:'Fractions',status:'Approved',approval_status:'Pending',class:'Class 5',category:'Fractions',subcategory:'Operations on Fractions',visibility:'Visible',content_type:'pdf',access_type:'free'};
test('blank or Pending editorial approval cannot inherit an Approved legacy status',()=>{
 for(const approval_status of ['',undefined,'Pending','Rejected']){
  const row=normalizeRegistryRow({...base,approval_status});
  assert.throws(()=>requireApprovedRegistryRow(row),/explicitly Approved/);
 }
 const approved=normalizeRegistryRow({...base,approval_status:'Approved'});requireApprovedRegistryRow(approved);
 assert.equal(normalizeRegistryRow({...base,approval_status:'Approved',import_status:'SUCCESS'}).status,'Imported');
 assert.throws(()=>normalizeRegistryRow({...base,approval_status:'APPROVED'}),/Approval must/);
});
test('all formats and multiple independent grades normalize without treating FALSE strings as true',()=>{
 for(const content_type of REGISTRY_FORMATS){const row=normalizeRegistryRow({...base,approval_status:'Approved',content_type,class:'Class 5, Class 6',grade_1:'Class 6',grade_2:'Class 12',download_allowed:'FALSE',annual_pass_included:'TRUE'});requireApprovedRegistryRow(row);assert.equal(row.class,'Class 5, Class 6, Class 12');assert.equal(row.download_allowed,false);assert.equal(row.annual_pass_included,true);assert.equal(row.category,'Fractions');}
});
test('invalid access, formats, visibility, missing grades and negative prices fail before storage writes',()=>{
 for(const patch of [{content_type:'executable'},{access_type:'public'},{visibility:'Maybe'},{class:''},{category:''},{price:-1},{price:'NaN'}])assert.throws(()=>requireApprovedRegistryRow(normalizeRegistryRow({...base,approval_status:'Approved',...patch})));
});
test('AI revision output is restricted to bounded text and cannot alter permissions, sources or approval',()=>{
 const text=Object.fromEntries(EDITORIAL_TEXT_FIELDS.map(field=>[field,'Revised lesson']));
 const revised=validateRegeneratedText({...text,approval_status:'Approved',download_allowed:true,drive_file_id:'replacement',category:'changed'});
 assert.deepEqual(revised,text);assert.equal(Object.hasOwn(revised,'approval_status'),false);
 for(const patch of [{title:''},{description:''},{title:'x'.repeat(301)},{tags:[]}])assert.throws(()=>validateRegeneratedText({...text,...patch}));
});
