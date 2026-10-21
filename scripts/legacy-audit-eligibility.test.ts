import assert from 'node:assert/strict';
import { test } from 'node:test';
import { auditLegacyPdfMigration } from '../src/lib/download/legacyMigrationAudit';
import { DOWNLOADABLE_ITEMS } from '../src/lib/download/downloadRegistry';
import { configurePdfBucket } from '../src/lib/download/pdfObjectStorage';
import type { FirestoreDocumentStore } from '../src/lib/firebase/documentStore';

test('audit refuses to call non-PDF or mismatched CMS records ready', async () => {
 const legacy = DOWNLOADABLE_ITEMS[0];
 const pdf = new TextEncoder().encode('%PDF-1.7\ncontent\n%%EOF\n');
 const base = { id:legacy.id,slug:legacy.slug,contentType:'pdf',visible:true,
   status:'published',downloadAllowed:true,accessType:legacy.accessType,
   files:[{url:'r2://mayf-study-materials/pdf/'+legacy.id+'.pdf',sizeBytes:pdf.length}] };
 let current:any = base;
 const db = { collection:()=>({doc:(id:string)=>({get:async()=>id===legacy.id?
   {exists:true,data:()=>current}:{exists:false,data:()=>undefined}})})} as unknown as FirestoreDocumentStore;
 configurePdfBucket({
   head:async()=>({size:pdf.length}),
   get:async()=>({size:pdf.length,body:new Response(pdf).body}),
 });
 try {
   for (const [patch,status] of [
      [{contentType:'video'},'cms_not_pdf'],
      [{id:'another-id'},'cms_id_mismatch'],
      [{slug:'another-slug'},'slug_mismatch'],
      [{files:[{url:'r2://mayf-study-materials/pdf/'+legacy.id+'.pdf',sizeBytes:999}]},'size_mismatch'],
   ] as const) {
      current={...base,...patch};
      const audit=await auditLegacyPdfMigration(db);
      assert.equal(audit.rows.find(x=>x.id===legacy.id)?.status,status);
   }
 } finally { configurePdfBucket(null); }
});
