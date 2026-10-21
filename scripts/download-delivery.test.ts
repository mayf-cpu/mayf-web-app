import test from 'node:test';
import assert from 'node:assert/strict';
import { DownloadTickets } from '../src/lib/download/downloadTickets';
import { fetchDownloadAsset } from '../src/lib/download/fileDelivery';

test('download tickets survive a fresh instance, bind to a network and allow one consumption', async () => {
  const docs = new Map<string, any>(); let version = 0;
  const store = { collection: () => ({ doc: (id: string) => ({
    get: async () => ({ data: () => structuredClone(docs.get(id)?.data), updateTime: docs.get(id)?.version }),
    set: async (data: any, condition: any) => {
      if (condition.exists === false && docs.has(id)) throw new Error('already exists');
      if (condition.updateTime && condition.updateTime !== docs.get(id)?.version) throw new Error('already consumed');
      docs.set(id, { data: structuredClone(data), version: String(++version) });
    },
  }) }) };
  let tickets = new DownloadTickets(() => store as any);
  const token = await tickets.issue({ contentId: 'qa-file', fileName: 'qa.pdf', mimeType: 'application/pdf', accessType: 'free', uid: null, clientIpHash: 'network', createdAt: Date.now(), expiresAt: Date.now() + 60000, used: false });
  tickets = new DownloadTickets(() => store as any);
  assert.equal((await tickets.read(token, 'network')).ticket.contentId, 'qa-file');
  await assert.rejects(tickets.read(token, 'other-network'), /network/);
  const results = await Promise.allSettled([tickets.consume(token, 'network'), tickets.consume(token, 'network')]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  await assert.rejects(tickets.read(token, 'network'), /used/);
});
test('expired download tickets fail closed', async () => {
  const store = { collection: () => ({ doc: () => ({ get: async () => ({ data: () => ({ expiresAt: 1, used: false, clientIpHash: 'ip' }) }) }) }) };
  await assert.rejects(new DownloadTickets(() => store as any).read('a'.repeat(64), 'ip'), /expired/);
});
test('file delivery returns actual PDF bytes and rejects HTML masquerading as a PDF', async t => {
  const asset = { name: 'resource.pdf', url: 'https://storage.googleapis.com/bucket/resource.pdf', mimeType: 'application/pdf' };
  t.mock.method(globalThis, 'fetch', async () => new Response('%PDF-1.7\nactual file', { status: 200 }));
  assert.equal((await fetchDownloadAsset(asset)).toString(), '%PDF-1.7\nactual file');
  t.mock.method(globalThis, 'fetch', async () => new Response('<html>permission denied</html>', { status: 200 }));
  await assert.rejects(fetchDownloadAsset(asset), /valid PDF/);
});
test('unapproved hosts and redirect responses cannot proxy arbitrary destinations', async t => {
  let requested = false;
  t.mock.method(globalThis, 'fetch', async () => { requested = true; return new Response('', { status: 302, headers: { Location: 'http://127.0.0.1/private' } }); });
  const asset = { name: 'qa.pdf', mimeType: 'application/pdf', url: 'http://127.0.0.1/private' };
  await assert.rejects(fetchDownloadAsset(asset), /source/); assert.equal(requested, false);
  await assert.rejects(fetchDownloadAsset({ ...asset, url: 'https://storage.googleapis.com/file' }), /unavailable/);
});
