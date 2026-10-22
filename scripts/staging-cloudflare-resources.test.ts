import assert from 'node:assert/strict';
import { test } from 'node:test';
import { verifyStagingCloudflareResources } from './check-staging-cloudflare-resources.mjs';

const token = 'local-mock-token-not-a-real-credential';
const accountId = 'a'.repeat(32);
const metadata = (bucket: unknown = {name:'mayf-staging-files'}, secrets: unknown = [{name:'FIREBASE_SERVICE_ACCOUNT_JSON',type:'secret_text'}]) => {
 const calls: string[] = [];
 const request = async (url: string, options: any) => {
  calls.push(url);
  assert.equal(options.method,'GET');
  assert.equal(options.redirect,'manual');
  assert.equal(options.headers.Authorization,'Bearer ' + token);
  return {ok:true,status:200,json:async()=>({success:true,result: url.includes('/r2/buckets/') ? bucket : secrets})} as any;
 };
 return {request: request as typeof fetch,calls};
};
test('isolated staging preflight uses only read-only metadata for R2 and secret name', async () => {
 const m=metadata();
 assert.deepEqual(await verifyStagingCloudflareResources({token,accountId,request:m.request}),{
  worker:'mayf-staging',bucket:'mayf-staging-files',serviceAccountBindingPresent:true,
 });
 assert.equal(m.calls.length,2);
 assert.match(m.calls[0],/\/r2\/buckets\/mayf-staging-files$/);
 assert.match(m.calls[1],/\/workers\/scripts\/mayf-staging\/secrets$/);
});
test('missing staging account, bucket or Worker service-account binding blocks a deploy', async () => {
 await assert.rejects(verifyStagingCloudflareResources({token,accountId:'not-an-account'}),/account ID/);
 await assert.rejects(verifyStagingCloudflareResources({token:'',accountId}),/API token/);
 await assert.rejects(verifyStagingCloudflareResources({token,accountId,request:metadata({name:'mayf-study-materials'}).request}),/R2 bucket/);
 await assert.rejects(verifyStagingCloudflareResources({token,accountId,request:metadata(undefined,[]).request}),/service.account binding|FIREBASE_SERVICE_ACCOUNT_JSON/);
});
test('Cloudflare HTTP failure and rejected API envelope never masquerade as readiness', async () => {
 await assert.rejects(verifyStagingCloudflareResources({token,accountId,request:async()=>({ok:false,status:403}) as any}),/HTTP 403/);
 await assert.rejects(verifyStagingCloudflareResources({token,accountId,request:async()=>({ok:true,json:async()=>({success:false})}) as any}),/unsuccessful/);
});
