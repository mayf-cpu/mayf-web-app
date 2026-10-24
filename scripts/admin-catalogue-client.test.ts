import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requestAdminCatalogue } from '../src/lib/cms/adminCatalogueClient';
const counts={total:0,active:0,archived:0,published:0,draft:0,hidden:0};
test('only a verified successful empty catalogue is represented as empty',async()=>{
  const result=await requestAdminCatalogue('/api/admin/content',{},async()=>new Response(JSON.stringify({success:true,items:[],counts})));
  assert.deepEqual(result.items,[]);assert.equal(result.counts.total,0);
});
test('network and HTTP failures reject instead of returning invented empty catalogue counts',async()=>{
  for(const status of [401,403,500,503,504]) await assert.rejects(requestAdminCatalogue('/api/admin/content',{},async()=>new Response('PRIVATE',{status})),new RegExp('HTTP '+status));
  await assert.rejects(requestAdminCatalogue('/api/admin/content',{},async()=>{throw Error('network offline');}),/network offline/);
});
test('invalid or unsuccessful catalogue payloads are never accepted as inventory',async()=>{
  for(const data of [{success:false,items:[],counts},{success:true,items:null,counts},{success:true,items:[null],counts},{success:true,items:[],counts:{...counts,total:-1}}]) await assert.rejects(requestAdminCatalogue('/api/admin/content',{},async()=>new Response(JSON.stringify(data))),/could not be verified/);
});
test('authenticated catalogue request preserves caller authorization',async()=>{
  await requestAdminCatalogue('/api/admin/content?search=Algebra',{Authorization:'Bearer fixture'},async(input:any,options:any)=>{assert.equal(input,'/api/admin/content?search=Algebra');assert.equal(options.method,'GET');assert.equal(options.headers.Authorization,'Bearer fixture');return new Response(JSON.stringify({success:true,items:[],counts}));});
});
