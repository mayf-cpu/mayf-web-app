import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { verifyWebhookSecret } from '../src/lib/ingestion/webhookAuth';

test('ingestion webhook refuses missing, short and public example secrets', () => {
  const prior = process.env.INGESTION_WEBHOOK_SECRET;
  try {
    delete process.env.INGESTION_WEBHOOK_SECRET;
    assert.equal(verifyWebhookSecret('Bearer anything'), false);
    process.env.INGESTION_WEBHOOK_SECRET = 'short-secret';
    assert.equal(verifyWebhookSecret('Bearer short-secret'), false);
    process.env.INGESTION_WEBHOOK_SECRET = 'mayf_ingest_secret_change_in_production_2026';
    assert.equal(verifyWebhookSecret('Bearer mayf_ingest_secret_change_in_production_2026'), false);
    process.env.INGESTION_WEBHOOK_SECRET = '  ' + 'a'.repeat(40);
    assert.equal(verifyWebhookSecret('Bearer ' + 'a'.repeat(40)), false);
  } finally {
    if (prior === undefined) delete process.env.INGESTION_WEBHOOK_SECRET;
    else process.env.INGESTION_WEBHOOK_SECRET = prior;
  }
});

test('ingestion webhook accepts only exact configured Bearer credentials', () => {
  const prior = process.env.INGESTION_WEBHOOK_SECRET;
  try {
    const secret = 'test-secret-' + 'd'.repeat(40);
    process.env.INGESTION_WEBHOOK_SECRET = secret;
    assert.equal(verifyWebhookSecret('Bearer ' + secret), true);
    assert.equal(verifyWebhookSecret('bearer ' + secret), true);
    assert.equal(verifyWebhookSecret(secret), false);
    assert.equal(verifyWebhookSecret('Basic ' + secret), false);
    assert.equal(verifyWebhookSecret('Bearer ' + secret + ' extra'), false);
    assert.equal(verifyWebhookSecret('Bearer ' + secret.slice(1)), false);
    assert.equal(verifyWebhookSecret(undefined), false);
  } finally {
    if (prior === undefined) delete process.env.INGESTION_WEBHOOK_SECRET;
    else process.env.INGESTION_WEBHOOK_SECRET = prior;
  }
});

test('admin import requests are authenticated and published sample credentials are absent from scripts', () => {
  const ui = readFileSync(new URL('../src/pages/AdminImportSyncPage.tsx', import.meta.url), 'utf8');
  const script = readFileSync(new URL('../google-apps-script/Code.gs', import.meta.url), 'utf8');
  for (const source of [ui, script]) {
    assert.doesNotMatch(source, /mayf_ingest_secret_change_in_production_2026/);
    assert.match(source, /MAYF_INGESTION_WEBHOOK_SECRET/);
    assert.match(source, /MAYF_WEBHOOK_URL/);
  }
  assert.match(ui, /await adminService\.getAuthHeaders\(\)/);
  assert.match(script, /setupInstallableTrigger/);
});
