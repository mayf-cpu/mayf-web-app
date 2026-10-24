import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

test('live staging smoke runner is opt-in, read-only and non-production', () => {
  const code = readFileSync(new URL('./staging-http-smoke.mjs', import.meta.url),'utf8');
  assert.match(code,/process\.argv\[2\]/);
  assert.match(code,/\.workers\.dev/);
  assert.match(code,/mayf\.co\.in/);
  assert.match(code,/redirect: 'manual'/);
  assert.match(code,/response\.status !== 401 && response\.status !== 403/);
  assert.doesNotMatch(code,/method:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/);
});

test('optional Admin staging checks fail closed on missing configuration without exposing token', () => {
  const code = readFileSync(new URL('./staging-http-smoke.mjs', import.meta.url),'utf8');
  assert.match(code, /process\.env\.MAYF_STAGING_ADMIN_TOKEN/);
  assert.match(code, /authenticated staging Admin access verification failed|Authenticated staging Admin access verification failed/);
  assert.match(code, /verifiedPdfImportAvailable/);
  assert.match(code, /Staging prerequisite unavailable/);
  assert.doesNotMatch(code, /console\.log\([^)]*adminToken/);
});
