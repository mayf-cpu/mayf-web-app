import assert from 'node:assert/strict';
import { test } from 'node:test';
import { submitDoubtRating } from '../src/lib/ai/feedbackClient';

test('AI feedback sends a fresh authenticated session and verifies durable acknowledgement', async () => {
  let tokens = 0;
  await submitDoubtRating({ getIdToken: async () => { tokens++; return 'test-session'; } }, 'doubt-123', 'helpful', (async (url, init) => {
    assert.equal(url, '/api/ai-teacher/rate');
    assert.equal((init!.headers as any).Authorization, 'Bearer test-session');
    assert.equal(init!.method, 'POST');
    assert.deepEqual(JSON.parse(init!.body as string), { doubtId: 'doubt-123', rating: 'helpful' });
    return new Response(JSON.stringify({ success: true, doubtId: 'doubt-123', rating: 'helpful' }));
  }) as typeof fetch);
  assert.equal(tokens, 1);
});

test('failed, malformed or mismatched AI feedback acknowledgements are rejected', async () => {
  const session = { getIdToken: async () => 'test-session' };
  for (const response of [new Response('{}', { status: 401 }), new Response('{}', { status: 503 }),
    new Response('bad'), new Response(JSON.stringify({ success: true, doubtId: 'another-answer', rating: 'helpful' })),
    new Response(JSON.stringify({ success: true, doubtId: 'doubt-123', rating: 'unhelpful' }))]) {
    await assert.rejects(submitDoubtRating(session, 'doubt-123', 'helpful', (async () => response) as typeof fetch), /not saved/);
  }
});

test('anonymous and invalid answer feedback never reaches the server', async () => {
  let calls = 0;
  const fetcher = (async () => { calls++; throw new Error('unexpected'); }) as typeof fetch;
  await assert.rejects(submitDoubtRating(null, 'doubt-123', 'helpful', fetcher), /Sign in/);
  await assert.rejects(submitDoubtRating({ getIdToken: async () => 'test-session' }, '../other', 'helpful', fetcher), /valid answer/);
  assert.equal(calls, 0);
});
