import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveBrandImageUrl} from '../src/lib/settings/brandImageUrl';
test('image page links resolve to direct allowlisted images and reuse successful metadata',async()=>{
 let calls=0;const request=async(_url:any,options:any)=>{calls++;assert.equal(options.redirect,'manual');assert.ok(options.signal);return new Response('<meta content="https://i.ibb.co/test/logo.png" property="og:image">');};
 assert.equal(await resolveBrandImageUrl('https://ibb.co/TestLogo',request),'https://i.ibb.co/test/logo.png');
 await resolveBrandImageUrl('https://ibb.co/TestLogo',request);assert.equal(calls,1);
});
test('arbitrary hosts are never fetched and unsafe image destinations are rejected',async()=>{
 let calls=0;const request=async()=>{calls++;return new Response('<meta property="og:image" content="http://127.0.0.1/private">');};
 assert.equal(await resolveBrandImageUrl('https://example.com/logo',request),'https://example.com/logo');assert.equal(calls,0);
 assert.equal(await resolveBrandImageUrl('https://ibb.co/UnsafeLogo',request),'https://ibb.co/UnsafeLogo');assert.equal(calls,1);
});
test('Classplus optimizer links use the original image without an optimizer request',async()=>{
 assert.equal(await resolveBrandImageUrl('https://diy-assets.classplus.co/_next/image?url=https://cdn-diy-public.classplus.co/prod/logo.png'),'https://cdn-diy-public.classplus.co/prod/logo.png');
});
