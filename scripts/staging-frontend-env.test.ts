import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';

const prod = JSON.parse(readFileSync(new URL('../src/config/firebasePublicConfig.json',import.meta.url),'utf8'));
const safe = {
 MAYF_STAGING_FIREBASE_PROJECT_ID: 'mayf-staging-checks',
 VITE_APP_ENV: 'staging',
 VITE_FIREBASE_PROJECT_ID: 'mayf-staging-checks',
 VITE_FIREBASE_API_KEY: 'AIzaSy' + 'a'.repeat(35),
 VITE_FIREBASE_AUTH_DOMAIN: 'mayf-staging-checks.firebaseapp.com',
 VITE_FIREBASE_STORAGE_BUCKET: 'mayf-staging-checks.firebasestorage.app',
 VITE_FIREBASE_MESSAGING_SENDER_ID: '1234567890',
 VITE_FIREBASE_APP_ID: '1:1234567890:web:abcdef123456',
};
const check = (overrides: Record<string, string>) =>
  execFileSync(process.execPath, ['scripts/check-staging-frontend-env.mjs'], {
    env: { ...process.env, MAYF_ALLOW_SHARED_DEVELOPMENT_FIREBASE: '', ...safe, ...overrides }, stdio: 'pipe',
  });
test('staging frontend config validates isolated Firebase web application', () => {
 assert.doesNotThrow(() => check({}));
});
test('staging frontend config rejects a production project or wrongly selected runtime', () => {
 assert.throws(() => check({ VITE_FIREBASE_PROJECT_ID: prod.projectId }));
 assert.throws(() => check({ MAYF_STAGING_FIREBASE_PROJECT_ID: prod.projectId, VITE_FIREBASE_PROJECT_ID: prod.projectId }));
 assert.throws(() => check({ VITE_APP_ENV: 'production' }));
 assert.throws(() => check({ VITE_FIREBASE_API_KEY: prod.apiKey }));
 assert.throws(() => check({ VITE_FIREBASE_APP_ID: prod.appId }));
 assert.throws(() => check({ VITE_FIREBASE_AUTH_DOMAIN: prod.authDomain }));
 assert.throws(() => check({ VITE_FIREBASE_STORAGE_BUCKET: prod.storageBucket }));
 assert.throws(() => check({ VITE_FIREBASE_API_KEY: '' }));
});

test('owner-approved shared development project requires explicit opt-in and matching web config', () => {
 const approved = {
  MAYF_ALLOW_SHARED_DEVELOPMENT_FIREBASE: 'true',
  MAYF_STAGING_FIREBASE_PROJECT_ID: prod.projectId, VITE_FIREBASE_PROJECT_ID: prod.projectId,
  VITE_FIREBASE_API_KEY: prod.apiKey, VITE_FIREBASE_AUTH_DOMAIN: prod.authDomain,
  VITE_FIREBASE_STORAGE_BUCKET: prod.storageBucket, VITE_FIREBASE_APP_ID: prod.appId,
  VITE_FIREBASE_MESSAGING_SENDER_ID: prod.messagingSenderId,
 };
 assert.doesNotThrow(() => check(approved));
 assert.throws(() => check({...approved, MAYF_ALLOW_SHARED_DEVELOPMENT_FIREBASE: ''}));
 assert.throws(() => check({...approved, VITE_FIREBASE_APP_ID: safe.VITE_FIREBASE_APP_ID}));
 assert.throws(() => check({...approved, VITE_APP_ENV: 'production'}));
});
