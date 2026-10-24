import {test} from 'node:test';
import assert from 'node:assert/strict';
import {productionHttpSmoke} from './production-http-smoke.mjs';
const good = (url: string) => new Response(JSON.stringify(url.endsWith('/api/health') ? {status:'ok',app:'Maths at Your Fingertips',environment:'production',firebaseConfigured:true,firebaseProjectMatchesWebConfig:true} : url.endsWith('/api/annual-pass/config') ? {success:true,checkoutEnabled:false} : {error:'Unauthorized'}), {status:url.includes('/api/admin/') || url.endsWith('/api/student/orders') ? 401 : 200,headers:{'content-type':'application/json'}});
test('production smoke tolerates bounded propagation while enforcing every final acceptance check',async()=>{
  let count=0;let pauses=0;
  await productionHttpSmoke({request:async(url:any,options:any)=>{assert.equal(options.method,'GET');assert.equal(options.redirect,'manual');assert.match(url,/^https:\/\/mayf\.co\.in\/api\//);count++;return count===1?new Response('not ready',{status:503}):good(url);},pause:async()=>{pauses++;},report:()=>{}});
  assert.equal(count,6);assert.equal(pauses,1);
});
test('persistent unhealthy production fails without exposing response bodies',async()=>{
  let count=0;const reports:string[]=[];
  await assert.rejects(productionHttpSmoke({attempts:3,request:async()=>{count++;return new Response('PRIVATE PROVIDER DATA',{status:503});},pause:async()=>{},report:(s:string)=>reports.push(s)}),/after 3 attempts: HTTP 503/);
  assert.equal(count,3);assert.doesNotMatch(reports.join(),/PRIVATE/);
});
test('staging identity, missing Firebase and enabled checkout cannot pass production smoke',async()=>{
  for (const change of [{environment:'staging'},{firebaseConfigured:false},{firebaseProjectMatchesWebConfig:false}]) {
    await assert.rejects(productionHttpSmoke({attempts:1,request:async()=>new Response(JSON.stringify({status:'ok',app:'Maths at Your Fingertips',environment:'production',firebaseConfigured:true,firebaseProjectMatchesWebConfig:true,...change}),{headers:{'content-type':'application/json'}}),report:()=>{}}),/api\/health/);
  }
  await assert.rejects(productionHttpSmoke({attempts:1,request:async(url:any)=>url.endsWith('/api/annual-pass/config')?new Response(JSON.stringify({success:true,checkoutEnabled:true}),{headers:{'content-type':'application/json'}}):good(url),report:()=>{}}),/annual-pass/);
});

test('robots and sitemap reach Worker routes instead of the SPA asset fallback',async()=>{
  const {readFileSync}=await import('node:fs');
  for(const filename of ['wrangler.jsonc','wrangler.staging.jsonc']){
    const config=JSON.parse(readFileSync(new URL('../'+filename,import.meta.url),'utf8'));
    for(const path of ['/api/*','/robots.txt','/sitemap.xml'])assert.ok(config.assets.run_worker_first.includes(path));
  }
});
