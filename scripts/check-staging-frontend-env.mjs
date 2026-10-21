#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const prod = JSON.parse(readFileSync(new URL('../src/config/firebasePublicConfig.json', import.meta.url), 'utf8'));
const env = process.env;
const required = [
  'MAYF_STAGING_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];
for (const key of required) {
  assert.ok(env[key] && env[key].trim() === env[key], 'Missing or malformed isolated staging frontend variable: ' + key);
  assert.ok(!/placeholder|changeme|replace/i.test(env[key]), 'Unconfigured staging frontend variable: ' + key);
}
assert.equal(env.VITE_APP_ENV, 'staging', 'Staging build must explicitly select VITE_APP_ENV=staging');
assert.equal(env.VITE_FIREBASE_PROJECT_ID, env.MAYF_STAGING_FIREBASE_PROJECT_ID,
  'Staging frontend project ID must match declared isolated staging Firebase project');
assert.notEqual(env.VITE_FIREBASE_PROJECT_ID, prod.projectId, 'Staging frontend must not use production Firebase');
assert.notEqual(env.VITE_FIREBASE_API_KEY, prod.apiKey, 'Staging web API key must not be production');
assert.notEqual(env.VITE_FIREBASE_AUTH_DOMAIN, prod.authDomain, 'Staging auth domain must not be production');
assert.notEqual(env.VITE_FIREBASE_STORAGE_BUCKET, prod.storageBucket, 'Staging storage bucket must not be production');
assert.notEqual(env.VITE_FIREBASE_APP_ID, prod.appId, 'Staging web app ID must not be production');
assert.match(env.VITE_FIREBASE_API_KEY, /^AIzaSy[A-Za-z0-9_-]{20,}$/, 'Expected a genuine-looking Firebase web API key');
assert.match(env.VITE_FIREBASE_AUTH_DOMAIN, /^[a-z0-9.-]+\.firebaseapp\.com$/, 'Staging must use isolated Firebase Auth domain');
assert.match(env.VITE_FIREBASE_STORAGE_BUCKET, /^[a-z0-9.-]+\.(firebasestorage\.app|appspot\.com)$/,
  'Expected Firebase storage bucket domain');
assert.match(env.VITE_FIREBASE_APP_ID, /^1:\d+:web:[A-Za-z0-9]+$/, 'Expected Firebase web app ID');
assert.match(env.VITE_FIREBASE_MESSAGING_SENDER_ID, /^\d+$/, 'Expected Firebase sender ID');
console.log('PASS: staging frontend Firebase build-time isolation validated (runtime Worker binding still needs inspection)');
