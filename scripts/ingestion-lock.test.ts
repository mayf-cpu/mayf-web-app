import assert from 'node:assert/strict';
import { test } from 'node:test';
import { IngestionLock } from '../src/lib/ingestion/ingestionLock';
import type { FirestoreDocumentStore } from '../src/lib/firebase/documentStore';
function fixture() {
 const docs = new Map<string,{data:any,version:number}>();
 const store = {
  collection: (collection:string) => ({ doc: (id:string) => ({ get:async()=> {
   const d=docs.get(collection+'/'+id);
   return {exists:!!d,updateTime:d?String(d.version):undefined,data:()=>d?.data};
  }})}),
  commit:async (writes:Array<{collection:string,id:string,data?:any,updateTime?:string}>)=>{
   for (const w of writes) {
    const key=w.collection+'/'+w.id, old=docs.get(key);
    if(w.updateTime ? !old || String(old.version)!==w.updateTime : !!old) throw Error('Conflict');
    if (w.data) docs.set(key,{data:w.data,version:(old?.version||0)+1});
    else docs.delete(key);
   }
  },
 } as unknown as FirestoreDocumentStore;
 return {store,docs};
}
test('simultaneous import attempts cannot acquire the same active lease',async()=>{
 const {store}=fixture();
 const a=new IngestionLock(store),b=new IngestionLock(store);
 const lease=await a.acquire('content-101',1000);
 await assert.rejects(b.acquire('content-101',1001),/already being imported/);
 await lease.release();
 const next=await b.acquire('content-101',1002);
 await next.release();
});
test('expired leases are reclaimed and stale workers cannot remove new owner lock',async()=>{
 const {store}=fixture();
 const old=await new IngestionLock(store).acquire('content-102',1000);
 const fresh=await new IngestionLock(store).acquire('content-102',200000);
 await old.release();
 await assert.rejects(new IngestionLock(store).acquire('content-102',200001),/already being imported/);
 await fresh.release();
});
