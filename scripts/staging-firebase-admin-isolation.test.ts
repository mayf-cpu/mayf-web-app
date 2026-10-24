import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getFirebaseAdminConfig } from '../src/lib/firebase/admin';

test('staging Firebase Admin refuses production and mismatched service account identity', () => {
 const keys = ['APP_ENV','MAYF_ALLOW_SHARED_DEVELOPMENT_FIREBASE','FIREBASE_SERVICE_ACCOUNT_JSON','GOOGLE_SERVICE_ACCOUNT_KEY','FIREBASE_ADMIN_PROJECT_ID','FIREBASE_ADMIN_CLIENT_EMAIL','FIREBASE_ADMIN_PRIVATE_KEY','VITE_FIREBASE_PROJECT_ID'];
 const prior = Object.fromEntries(keys.map(key => [key,process.env[key]]));
 const project = 'mayf-stage-tests-123';
 try {
  process.env.APP_ENV = 'staging';
  delete process.env.MAYF_ALLOW_SHARED_DEVELOPMENT_FIREBASE;
  delete process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  delete process.env.FIREBASE_ADMIN_PROJECT_ID;
  delete process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  delete process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const account = {project_id:project,client_email:'service@'+project+'.iam.gserviceaccount.com',private_key:'-----BEGIN PRIVATE KEY-----TEST STAGING VALUE-----END PRIVATE KEY-----'};
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify(account);
  assert.equal(getFirebaseAdminConfig().isReady, true);
  process.env.FIREBASE_ADMIN_PROJECT_ID = 'maths-at-your-fingertips';
  assert.equal(getFirebaseAdminConfig().isReady, false);
  delete process.env.FIREBASE_ADMIN_PROJECT_ID;
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({...account,project_id:'maths-at-your-fingertips'});
  assert.equal(getFirebaseAdminConfig().isReady, false);
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({...account,project_id:'maths-at-your-fingertips',client_email:'service@maths-at-your-fingertips.iam.gserviceaccount.com'});
  assert.equal(getFirebaseAdminConfig().isReady, false);
  process.env.MAYF_ALLOW_SHARED_DEVELOPMENT_FIREBASE = 'true';
  assert.equal(getFirebaseAdminConfig().isReady, true);
  process.env.FIREBASE_ADMIN_PROJECT_ID = 'unapproved-project';
  assert.equal(getFirebaseAdminConfig().isReady, false);
  delete process.env.FIREBASE_ADMIN_PROJECT_ID;
  delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  assert.equal(getFirebaseAdminConfig().isReady, false);
 } finally {
  for (const key of keys) if (prior[key] === undefined) delete process.env[key]; else process.env[key]=prior[key];
 }
});
