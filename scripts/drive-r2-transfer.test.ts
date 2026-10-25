import assert from 'node:assert/strict';
import { test } from 'node:test';
import crypto from 'node:crypto';
import { configurePdfBucket } from '../src/lib/download/pdfObjectStorage';
import { copyDriveFileToProductionStorage } from '../src/lib/ingestion/driveStorageAdapter';

test('Drive import requires private upload configuration and rejects unsupported types', async () => {
  configurePdfBucket(null);
  await assert.rejects(copyDriveFileToProductionStorage('drive-id-123', undefined, 'a', 'pdf', 'paid', 'cnt-pdf-a'), /R2 PDF bucket/);
  await assert.rejects(copyDriveFileToProductionStorage('drive-id-123', undefined, 'a', 'other', 'paid', 'cnt-pdf-a'), /PDF and video content only/);
});

test('Drive import verifies authenticated downloaded bytes before declaring an R2 upload successful', async () => {
  const oldCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const oldFetch = globalThis.fetch;
  const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify({
    client_email: 'test@example.iam.gserviceaccount.com',
    private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
  });
  const valid = new TextEncoder().encode('%PDF-1.4\nfixture-data-123\n%%EOF\n');
  const objects = new Map<string,Uint8Array>();
  const calls:string[] = [];
  configurePdfBucket({
    head: async (key: string) => objects.has(key) ? {size:objects.get(key)!.length} : null,
    get: async () => null,
    put: async (key: string, bytes: Uint8Array) => { objects.set(key, bytes); },
  });
  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    return url.includes('oauth2.googleapis.com')
      ? new Response(JSON.stringify({ access_token: 'testing-only-token' }), {status: 200})
      : new Response(Buffer.from(valid), {status: 200, headers: {'content-type':'application/pdf'}});
  };
  try {
    const result = await copyDriveFileToProductionStorage('drive-id-123', undefined, 'topic', 'pdf', 'paid', 'cnt-pdf-topic');
    assert.equal(result.fileSizeBytes, valid.byteLength);
    const digest = crypto.createHash('sha256').update(valid).digest('hex');
    const key = 'pdf/cnt-pdf-topic/' + digest + '.pdf';
    assert.equal(result.productionFileUrl, 'r2://mayf-study-materials/' + key);
    assert.deepEqual(objects.get(key), valid);
    const repeated = await copyDriveFileToProductionStorage('drive-id-123', undefined, 'topic', 'pdf', 'paid', 'cnt-pdf-topic');
    assert.equal(repeated.productionFileUrl, result.productionFileUrl);
    assert.equal(objects.size, 1, 'same PDF must not create new revision');
  } finally {
    globalThis.fetch = oldFetch;
    if(oldCredentials === undefined) delete process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    else process.env.GOOGLE_SERVICE_ACCOUNT_KEY = oldCredentials;
    configurePdfBucket(null);
  }
});
