import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (p: string) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('admin refund endpoint never claims gateway funds refunded without initiation', () => {
  const server = read('server.ts');
  const start = server.indexOf("app.post('/api/admin/orders/:orderId/refund'");
  const end = server.indexOf('// -------------------------------------------------------------', start);
  assert.ok(start > -1 && end > start);
  const route = server.slice(start, end);
  assert.match(route, /status\(501\)/);
  assert.match(route, /REFUND_INITIATION_NOT_IMPLEMENTED/);
  assert.doesNotMatch(route, /REFUND_PROCESSED|status: 'refunded'|success: true/);
});

test('admin orders are always from the durable ledger and never seeded examples', () => {
  const server = read('server.ts');
  const start = server.indexOf("app.get('/api/admin/orders'");
  const end = server.indexOf('\n}));', start);
  assert.ok(start > -1 && end > start);
  const route = server.slice(start, end);
  assert.match(route, /getAdminFirestore\(\)/);
  assert.match(route, /new DurablePaymentRepository\(db\)\.getAllOrders\(\)/);
  assert.match(route, /status\(503\)/);
  assert.doesNotMatch(route, /ord-801|arjun\.sharma|priya\.patel|pay_rzp_98a7/);
  assert.match(route, /grossAmount - order\.discount \+ \(order\.tax \|\| 0\)/);
});

test('admin ledger cannot hide fetch errors or export inert test amounts', () => {
  const service = read('src/services/adminService.ts');
  const section = service.slice(service.indexOf('async getOrders()'), service.indexOf('async processRefund('));
  assert.doesNotMatch(section, /catch\s*\{\s*return \[\]/);
  assert.match(section, /if \(!res\.ok\) throw/);
  const ui = read('src/components/admin/sections/AdminOrdersSection.tsx');
  assert.match(ui, /onClick=\{exportLedger\}/);
  assert.match(ui, /role="alert"/);
  assert.match(ui, /safeCsvCell/);
  assert.match(ui, /ord\.currency === 'INR'/);
});