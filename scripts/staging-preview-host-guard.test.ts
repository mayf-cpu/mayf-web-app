import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
const source=readFileSync(new URL('./staging-http-smoke.mjs',import.meta.url),'utf8');
test('staging runner rejects production Worker hostname',()=>{
 assert.ok(source.includes("workerName !== 'mayf'"));
 assert.ok(source.includes('!previewHostname'));
 assert.ok(source.includes("url.hostname.endsWith('.workers.dev')"));
});
