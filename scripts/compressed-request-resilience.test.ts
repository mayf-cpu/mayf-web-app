import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

test('malformed trailing gzip bytes cannot terminate the JSON parser process', async () => {
  // Isolate this request: vulnerable body-parser releases throw an uncaught stream error.
  const script = `
    import express from 'express';
    import { gzipSync } from 'node:zlib';
    import { setTimeout } from 'node:timers/promises';
    const app = express();
    app.use(express.json());
    app.post('/', (_req, res) => res.json({ ok: true }));
    app.get('/health', (_req, res) => res.json({ healthy: true }));
    app.use((err, _req, res, _next) => res.status(err.status || 500).json({ error: 'Rejected body' }));
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    try {
      const base = 'http://127.0.0.1:' + server.address().port;
      const body = Buffer.concat([gzipSync(Buffer.from('{"ok":true}')), Buffer.from('not-another-gzip-frame')]);
      const response = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Encoding': 'gzip' }, body });
      if (![200, 400].includes(response.status)) throw Error('Unexpected compressed request status: ' + response.status);
      await response.text();
      await setTimeout(75);
      const health = await fetch(base + '/health');
      if (health.status !== 200 || !(await health.json()).healthy) throw Error('Server did not survive');
      console.log('parser-survived');
    } finally { await new Promise(resolve => server.close(resolve)); }
  `;
  const { stdout } = await promisify(execFile)(process.execPath, ['--input-type=module', '-e', script], {
    cwd: process.cwd(), timeout: 10000, maxBuffer: 20000,
  });
  assert.match(stdout, /parser-survived/);
});
