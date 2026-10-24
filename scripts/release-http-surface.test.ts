import test from 'node:test';
import assert from 'node:assert/strict';
test('every registered private API denies anonymous and forged sessions in deployed mode', async t => {
  process.env.NODE_ENV = 'production'; process.env.APP_ENV = 'production';
  for (const name of ['FIREBASE_SERVICE_ACCOUNT_JSON', 'GOOGLE_SERVICE_ACCOUNT_KEY', 'FIREBASE_ADMIN_PRIVATE_KEY', 'FIREBASE_ADMIN_CLIENT_EMAIL']) delete process.env[name];
  const { app } = await import('../server');
  const server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
  const base = 'http://127.0.0.1:' + (server.address() as { port: number }).port;
  let checked = 0;
  try {
    const routes = (app as any)._router.stack.filter((layer: any) => layer.route).map((layer: any) => layer.route);
    for (const route of routes) {
      if (typeof route.path !== 'string' || !/^\/api\/(admin|student)(\/|$)/.test(route.path)) continue;
      const path = route.path.replace(/:[A-Za-z0-9_]+/g, 'qa-private');
      for (const method of Object.keys(route.methods)) {
        for (const forged of [false, true]) {
          const response = await fetch(base + path, { method: method.toUpperCase(),
            headers: { 'Content-Type': 'application/json', ...(forged ? { Authorization: 'Bearer dev-admin-forged@example.test' } : {}) },
            ...(['get', 'head'].includes(method) ? {} : { body: '{}' }) });
          assert.ok([401, 403, 404, 503].includes(response.status), `${method} ${path}: ${response.status}`);
          assert.match(response.headers.get('content-type') || '', /application\/json/);
          assert.match(response.headers.get('cache-control') || '', /private|no-store/);
          await response.json(); checked++;
        }
      }
    }
    assert.ok(checked >= 100, 'Coverage must include the full registered admin/student surface');
    t.diagnostic(`${checked} real HTTP authorization/cache checks across registered admin/student routes`);
    const csrf = await fetch(base + '/api/analytics/track', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://untrusted.example' }, body: '{}' });
    assert.equal(csrf.status, 403);
  } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
});
