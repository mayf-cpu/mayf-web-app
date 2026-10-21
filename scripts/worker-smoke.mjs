import assert from 'node:assert/strict';
import path from 'node:path';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
const root = path.resolve('.worker-test');
const mf = new Miniflare(convertV4MiniflareOptions({
  modules: true, modulesRoot: root, scriptPath: path.join(root, 'worker.js'),
  compatibilityDate: '2026-10-19', compatibilityFlags: ['nodejs_compat'],
  host: '127.0.0.1', port: 0,
}));
try {
  for (const [route, status] of [
    ['/api/health', 200], ['/api/admin/verify-access', 401],
    ['/api/admin/content', 401], ['/api/formulas', 200],
    ['/api/student/orders/ord-private/confirmation', 401],
    ['/api/admin/payments/refunds', 401],
    ['/api/downloads/file/definitely-not-a-real-token', 404],
    ['/api/not-a-real-route', 404],
  ]) {
    const response = await mf.dispatchFetch(`http://localhost${route}`);
    assert.equal(response.status, status, route);
    assert.match(response.headers.get('content-type') || '', /application\/json/, route);
    await response.json();
    console.log(`PASS ${route}: ${status}, JSON`);
  }
} finally { await mf.dispose(); }
