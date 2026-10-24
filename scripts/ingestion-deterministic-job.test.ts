import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ingestionJobIdForContent } from '../src/lib/ingestion/ingestionJobId';
test('same content ID maps to one durable job ID on all workers',()=>{
 const a=ingestionJobIdForContent('MAYF-C10-ALG-001');
 assert.equal(a,ingestionJobIdForContent(' MAYF-C10-ALG-001 '));
 assert.match(a,/^job-[a-f0-9]{64}$/);
 assert.notEqual(a,ingestionJobIdForContent('MAYF-C10-ALG-002'));
});
test('invalid identifiers cannot create Firestore documents',()=>{
 assert.throws(()=>ingestionJobIdForContent(''),/Invalid/);
 assert.throws(()=>ingestionJobIdForContent('a'.repeat(513)),/Invalid/);
});
