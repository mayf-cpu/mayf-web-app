import test from 'node:test';
import assert from 'node:assert/strict';

// Exercise the actual Express routes with production authentication rules.
test('API rejects anonymous and forged admin requests and returns JSON for missing routes', async () => {
  process.env.NODE_ENV = 'production';
  const { app } = await import('../server');
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address() as { port: number };
  const base = `http://127.0.0.1:${address.port}`;
  try {
    for (const headers of [{}, { Authorization: 'Bearer dev-admin-ntnagrawal146@gmail.com' }] as Record<string, string>[]) {
      const response = await fetch(`${base}/api/admin/verify-access`, { headers });
      assert.equal(response.status, 401);
      assert.match(response.headers.get('content-type') || '', /application\/json/);
    }
    const response = await fetch(`${base}/api/not-a-real-route`);
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'API endpoint not found' });
  } finally {
    await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});
