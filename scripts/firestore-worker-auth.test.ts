import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {getAdminFirestore} from '../src/lib/firebase/admin';
test('the actual Firestore factory uses bounded fetch OAuth once across concurrent reads',async t=>{
  const previous={account:process.env.FIREBASE_SERVICE_ACCOUNT_JSON,app:process.env.APP_ENV,fetch:globalThis.fetch};
  const key=generateKeyPairSync('rsa',{modulusLength:2048}).privateKey.export({type:'pkcs8',format:'pem'}).toString();
  process.env.APP_ENV='production';
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON=JSON.stringify({project_id:'factory-fixture',client_email:'factory@example.invalid',private_key:key});
  t.after(()=>{globalThis.fetch=previous.fetch;for(const [name,value] of [['FIREBASE_SERVICE_ACCOUNT_JSON',previous.account],['APP_ENV',previous.app]]){if(value===undefined)delete process.env[name!];else process.env[name!]=value;}});
  let oauth=0;let reads=0;
  globalThis.fetch=async(input:any,options:any)=>{
    assert.ok(options.signal);
    if(String(input)==='https://oauth2.googleapis.com/token'){
      oauth++;assert.equal(options.method,'POST');assert.equal(options.redirect,'manual');
      const assertion=new URLSearchParams(options.body).get('assertion')!;
      const claim=JSON.parse(Buffer.from(assertion.split('.')[1],'base64url').toString());
      assert.equal(claim.scope,'https://www.googleapis.com/auth/datastore');
      return new Response(JSON.stringify({access_token:'factory-test-token',expires_in:3600}));
    }
    reads++;assert.match(String(input),/^https:\/\/firestore.googleapis.com\/v1\/projects\/factory-fixture\//);
    assert.equal(options.headers.Authorization,'Bearer factory-test-token');
    return new Response('',{status:404});
  };
  const db=getAdminFirestore();assert.ok(db);
  await Promise.all(Array.from({length:6},(_,i)=>db.collection('fixture').doc(String(i)).get()));
  assert.equal(oauth,1);assert.equal(reads,6);
});
