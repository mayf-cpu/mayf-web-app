import assert from 'node:assert/strict';
import { test } from 'node:test';
import { allowedPdfKey, versionedPdfKey } from '../src/lib/download/pdfObjectStorage';
import { resolveDownloadableItem } from '../src/lib/download/cmsDownloadResolver';
import type { FirestoreDocumentStore } from '../src/lib/firebase/documentStore';
const digest='a'.repeat(64);
test('versioned private PDF keys enforce exact content ownership',()=>{
 const key=versionedPdfKey('cnt-pdf-7',digest);
 assert.equal(allowedPdfKey('cnt-pdf-7',key),key);
 assert.throws(()=>allowedPdfKey('cnt-pdf-8',key),/Invalid/);
 assert.throws(()=>allowedPdfKey('cnt-pdf-7','pdf/../secrets.pdf'),/Invalid/);
});
test('CMS resolver uses the published revision, never guessed latest version',async()=>{
 const key=versionedPdfKey('cnt-pdf-7',digest);
 const item={id:'cnt-pdf-7',slug:'sample',title:'Sample',contentType:'pdf',
 visible:true,status:'published',isDeleted:false,downloadAllowed:true,accessType:'paid',
 files:[{url:'r2://mayf-study-materials/'+key,sizeBytes:1024}]};
 const db={
  collection:()=>({doc:()=>({get:async()=>({exists:true,data:()=>item})})}),
  queryEqual:async()=>[],
 } as unknown as FirestoreDocumentStore;
 const resolved=await resolveDownloadableItem(db,'cnt-pdf-7');
 assert.equal(resolved?.objectKey,key);
 assert.equal(resolved?.accessType,'paid');
});
