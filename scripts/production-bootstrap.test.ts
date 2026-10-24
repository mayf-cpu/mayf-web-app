import { test } from 'node:test';
import assert from 'node:assert/strict';
import { provisionProductionBucket } from './provision-production-bucket.mjs';
import { productionRollbackVersion } from './record-production-rollback.mjs';
const auth = {token:'private', accountId:'a'.repeat(32)};
test('existing production bucket is reused without any mutation',async()=>{
  let calls=0;
  const result=await provisionProductionBucket({...auth,request:async(url:any,options:any)=>{calls++;assert.equal(options.method,'GET');assert.match(String(url),/\/r2\/buckets\/mayf-study-materials$/);return new Response(JSON.stringify({success:true,result:{name:'mayf-study-materials'}}));}});
  assert.equal(result.created,false);assert.equal(calls,1);
});
test('only confirmed missing production bucket triggers one exact private bucket create',async()=>{
  const methods:string[]=[];
  const result=await provisionProductionBucket({...auth,request:async(_url:any,options:any)=>{methods.push(options.method);if(options.method==='GET')return new Response('',{status:404});assert.deepEqual(JSON.parse(options.body),{name:'mayf-study-materials'});assert.equal(options.redirect,'manual');return new Response(JSON.stringify({success:true,result:{name:'mayf-study-materials'}}));}});
  assert.deepEqual(methods,['GET','POST']);assert.equal(result.created,true);
});
test('bucket permission failures never trigger a create attempt',async()=>{
  let calls=0;await assert.rejects(provisionProductionBucket({...auth,request:async()=>{calls++;return new Response('PRIVATE',{status:403});}}),/HTTP 403/);assert.equal(calls,1);
});
test('rollback records the newest single 100% version and rejects split deployments',async()=>{
  const version='cdee813a-2f20-4a2a-a520-10fafb0e202d';
  const request=async()=>new Response(JSON.stringify({success:true,result:{deployments:[{created_on:'2026-10-24T12:00:00Z',versions:[{version_id:version,percentage:100}]},{created_on:'2026-10-23T12:00:00Z',versions:[{version_id:'bad',percentage:100}]}]}}));
  assert.equal(await productionRollbackVersion({...auth,request}),version);
  await assert.rejects(productionRollbackVersion({...auth,request:async()=>new Response(JSON.stringify({success:true,result:{deployments:[{created_on:'2026-10-24T12:00:00Z',versions:[{version_id:version,percentage:50},{version_id:version,percentage:50}]}]}}))}),/single 100%/);
});
