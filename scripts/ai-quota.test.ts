import test from 'node:test';
import assert from 'node:assert/strict';
import { AiQuota } from '../src/lib/ai/aiQuota';

function fixture() {
  const values = new Map<string, any>(); let revision = 0;
  const store = { collection: () => ({ doc: (id: string) => ({
    get: async () => { const value = structuredClone(values.get(id)); return { exists: Boolean(value), updateTime: value?.version, data: () => value?.data }; },
    set: async (data: any, condition: any) => {
      await Promise.resolve();
      const current = values.get(id);
      if (condition.exists === false && current || condition.updateTime && condition.updateTime !== current?.version) throw new Error('write conflict 412');
      values.set(id, { data: structuredClone(data), version: String(++revision) });
    },
  }) }) };
  return () => new AiQuota(() => store as any);
}
test('AI request quota survives restart and resets on the next IST day', async () => {
  const fresh = fixture(); const now = Date.parse('2026-10-21T18:29:00Z');
  assert.equal((await fresh().consume('student', 1, now)).allowed, true);
  assert.equal((await fresh().consume('student', 1, now)).allowed, false);
  assert.equal((await fresh().consume('student', 1, now + 120000)).allowed, true);
});
test('competing isolates cannot consume the same final AI request allowance', async () => {
  const fresh = fixture();
  const results = await Promise.all([fresh().consume('student', 1), fresh().consume('student', 1), fresh().consume('student', 1)]);
  assert.equal(results.filter(result => result.allowed).length, 1);
});
