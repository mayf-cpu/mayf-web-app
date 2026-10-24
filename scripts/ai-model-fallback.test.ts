import assert from 'node:assert/strict';
import test from 'node:test';
import { generateWithModelFallback } from '../src/lib/ai/modelFallback';

test('missing model falls back once and returns the actual generated response', async () => {
  const calls: string[] = [];
  const result = await generateWithModelFallback(['missing', 'working', 'working'], async model => {
    calls.push(model);
    if (model === 'missing') throw { status: 404, message: 'provider detail' };
    return { text: 'x = 4' };
  }, () => {});
  assert.deepEqual(calls, ['missing', 'working']);
  assert.deepEqual(result, { success: true, model: 'working', response: { text: 'x = 4' } });
});

test('account and request failures stop retries and never disclose provider error details', async () => {
  for (const [status, code] of [[401, 'AI_ACCESS_DENIED'], [403, 'AI_ACCESS_DENIED'],
    [429, 'AI_QUOTA_EXCEEDED'], [400, 'AI_REQUEST_REJECTED']] as const) {
    const calls: string[] = []; const logs: unknown[] = [];
    const result = await generateWithModelFallback(['first', 'second'], async model => {
      calls.push(model);
      throw { status, message: 'key=secret-value question=private-question', request: { apiKey: 'secret-value' } };
    }, failure => logs.push(failure));
    assert.deepEqual(calls, ['first']);
    assert.deepEqual(result, { success: false, code });
    assert.doesNotMatch(JSON.stringify({ result, logs }), /secret-value|private-question|apiKey/);
  }
});

test('a stalled model times out and a working fallback still succeeds', async () => {
  const failures: unknown[] = [];
  const result = await generateWithModelFallback(['stalled', 'working'], model =>
    model === 'stalled' ? new Promise<{ text: string }>(() => {}) : Promise.resolve({ text: '4' }),
  failure => failures.push(failure), 5);
  assert.equal(result.success, true);
  assert.deepEqual(failures, [{ model: 'stalled', code: 'AI_PROVIDER_TIMEOUT', status: null, retryModel: true }]);
});

test('empty and failed provider responses cannot report a solved question', async () => {
  assert.deepEqual(await generateWithModelFallback(['empty'], async () => ({ text: '  ' }), () => {}),
    { success: false, code: 'AI_EMPTY_RESPONSE' });
  assert.deepEqual(await generateWithModelFallback(['down'], async () => { throw { status: 503 }; }, () => {}),
    { success: false, code: 'AI_PROVIDER_UNAVAILABLE' });
});

test('invalid API key reason is reduced to a fixed code without leaking request details', async () => {
  const failures: unknown[] = [];
  const result = await generateWithModelFallback(['first', 'second'], async () => {
    throw { status: 400, message: JSON.stringify({ error: { details: [{ reason: 'API_KEY_INVALID' }], apiKey: 'secret-value' } }) };
  }, failure => failures.push(failure));
  assert.deepEqual(result, { success: false, code: 'AI_API_KEY_INVALID' });
  assert.equal(failures.length, 1);
  assert.doesNotMatch(JSON.stringify(failures), /secret-value|apiKey/);
});
