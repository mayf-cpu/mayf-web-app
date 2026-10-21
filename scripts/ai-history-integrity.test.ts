import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (file: string) => readFileSync(new URL('../' + file, import.meta.url), 'utf8');

test('student and admin AI history must be real durable Firestore records', () => {
  const server = read('server.ts');
  assert.doesNotMatch(server, /AI_DOUBTS_HISTORY|doubt-seed-1|doubt-seed-2|checkAiQuota\(/);
  assert.match(server, /app\.get\('\/api\/ai-teacher\/history', requireAuth/);
  assert.match(server, /db\.queryEqual\('aiTeacherSessions', 'userId', req\.userAuth!\.uid\)/);
  assert.match(server, /app\.post\('\/api\/ai-teacher\/rate', requireAuth/);
  assert.match(server, /record\.userId !== req\.userAuth!\.uid/);
  assert.match(server, /db\.collection\('aiTeacherSessions'\)\.doc\(doubtId\)\.set/);
  assert.match(server, /app\.get\('\/api\/admin\/ai-activity', requireAuth, requireAdmin, asyncRoute/);
});

test('Gemini failure cannot masquerade as a solved math question', () => {
  const server = read('server.ts');
  assert.doesNotMatch(server, /professor-sigma-pedagogical-engine|pedagogicalFallback|fallbackText/);
  assert.match(server, /if \(!aiClient \|\| !geminiApiKey\)/);
  assert.match(server, /if \(!successfullyGenerated\) \{\s*return res\.status\(503\)/);
  assert.match(server, /await getAppCheck\(app\)\.verifyToken\(appCheckToken\)/);
  assert.match(server, /await aiQuota\.consume\(quotaKey, userLimit\)/);
  assert.match(server, /await checkDownloadRateLimit\(`ai-\$\{quotaKey\}`, 15, 180000\)/);
});
