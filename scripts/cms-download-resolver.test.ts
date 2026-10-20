import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveDownloadableItem } from '../src/lib/download/cmsDownloadResolver';
import type { FirestoreDocumentStore } from '../src/lib/firebase/documentStore';

const pdf = {
 id:'cnt-pdf-topic',slug:'topic',title:'Topic PDF',visible:true,status:'published',
 contentType:'pdf',accessType:'paid',downloadAllowed:true,isDeleted:false,
 classLevels:['Class 8'],categoryId:'algebra',files:[{
  url:'r2://mayf-study-materials/pdf/cnt-pdf-topic.pdf',sizeBytes:1234,
 }],
};
const storage = (item: Record<string,unknown>) => ({
 collection: () => ({doc: async (_id:string) => ({})}),
 queryEqual: async (_c:string,_k:string,_v:string) => [{data:item}],
}) as unknown as FirestoreDocumentStore;
function db(item:Record<string,unknown>) {
 return {
   collection: (_name: string) => ({doc: (_id:string) => ({get:async () => ({exists:false,data:()=>undefined})})}),
   queryEqual: async () => [{data:item}],
 } as unknown as FirestoreDocumentStore;
}
test('published private R2 CMS PDF resolves by slug',async()=>{
 const result=await resolveDownloadableItem(db(pdf),'topic');
 assert.equal(result?.id,'cnt-pdf-topic');
 assert.equal(result?.accessType,'paid');
});
test('hidden, draft, archived, unlinked and view-only PDF never resolves',async()=>{
 for(const patch of [{visible:false},{status:'draft'},{status:'archived'},{isDeleted:true},
 {downloadAllowed:false},{contentType:'video'},{files:[{url:'https://example.com/file.pdf'}]}]){
   assert.equal(await resolveDownloadableItem(db({...pdf,...patch}),'topic'),null);
 }
});
