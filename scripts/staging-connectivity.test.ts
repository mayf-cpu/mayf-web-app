import assert from 'node:assert/strict';
import { test } from 'node:test';
import { probeStagingConnectivity } from '../src/lib/ingestion/stagingConnectivity';
import type { FirestoreDocumentStore } from '../src/lib/firebase/documentStore';
import type { PdfR2Bucket } from '../src/lib/download/pdfObjectStorage';

test('read-only Firestore and R2 probes accept missing probe objects', async () => {
 let reads=0;
 const db = {collection:()=>({doc:()=>({get:async()=>{reads++;return {exists:false};}})})} as unknown as FirestoreDocumentStore;
 const bucket = {head:async()=>{reads++;return null;}} as unknown as PdfR2Bucket;
 assert.deepEqual(await probeStagingConnectivity(db,bucket),{firestore:'reachable',r2:'reachable'});
 assert.equal(reads,2);
});
test('connectivity probe fails closed on provider errors',async()=>{
 const db={collection:()=>({doc:()=>({get:async()=>{throw Error('private key details');}})})} as unknown as FirestoreDocumentStore;
 const bucket={head:async()=>{throw Error('private binding details');}} as unknown as PdfR2Bucket;
 assert.deepEqual(await probeStagingConnectivity(db,bucket),{firestore:'unavailable',r2:'unavailable'});
});
