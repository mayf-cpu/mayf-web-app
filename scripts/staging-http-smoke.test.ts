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
