import assert from 'node:assert/strict';
import { test } from 'node:test';
import { auditLegacyPdfMigration } from '../src/lib/download/legacyMigrationAudit';
import { configurePdfBucket } from '../src/lib/download/pdfObjectStorage';
import type { FirestoreDocumentStore } from '../src/lib/firebase/documentStore';

test('audit never marks malformed PDF ready even if R2 HEAD succeeds',async()=>{
 const id='dl-10-cheatsheet';
 const doc={id,slug:'class-10-board-complete-formula-cheatsheet',contentType:'pdf',status:'published',visible:true,
   isDeleted:false,downloadAllowed:true,accessType:'free',
   files:[{url:'r2://mayf-study-materials/pdf/'+id+'.pdf'}]};
 const db={collection:()=>({doc:(key:string)=>({get:async()=>key===id?
   {exists:true,data:()=>doc}:{exists:false,data:()=>undefined}})})} as unknown as FirestoreDocumentStore;
 const data=new TextEncoder().encode('not a real pdf, only a mocked file with valid length');
 configurePdfBucket({
   head:async()=>({size:data.length}),
   get:async()=>({size:data.length,body:new Response(data).body}),
 });
 try {
   const result=await auditLegacyPdfMigration(db);
   const row=result.rows.find(x=>x.id===id);
   assert.equal(row?.status,'r2_pdf_invalid');
   assert.equal(row?.r2FileVerifiedByHead,true);
   assert.equal(row?.pdfBytesValidated,false);
 } finally { configurePdfBucket(null); }
});
