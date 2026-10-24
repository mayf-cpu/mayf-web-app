import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { launchDisplaySettings, passDisplayCopy, usableWhatsApp } from '../src/lib/settings/launchDisplay';
import { DEFAULT_SITE_SETTINGS } from '../src/lib/settings/siteSettingsTypes';
import { inspectProductionResources } from './inspect-production-resources.mjs';

test('starter contact values are hidden without changing owner settings or financial terms', () => {
  const before = structuredClone(DEFAULT_SITE_SETTINGS);
  const shown = launchDisplaySettings(before);
  assert.equal(shown.contact.supportPhone, ''); assert.equal(shown.social.whatsapp, '');
  assert.equal(shown.contact.whatsappSupport, ''); assert.deepEqual(before, DEFAULT_SITE_SETTINGS);
  before.contact.supportPhone = '+91 70000 12345'; before.social.whatsapp = 'https://chat.whatsapp.com/owner-real-link';
  const owner = launchDisplaySettings(before);
  assert.equal(owner.contact.supportPhone, before.contact.supportPhone);
  assert.equal(owner.social.whatsapp, before.social.whatsapp);
  assert.equal(owner.homepageCopy.annualPassGuarantee, before.homepageCopy.annualPassGuarantee);
  assert.equal(usableWhatsApp(undefined), '');
});

test('only known unsupported starter pass claims are normalized, custom owner text is preserved', () => {
  assert.match(passDisplayCopy('Unlimited 24/7 Multimodal AI Teacher (Professor Sigma) doubts'), /daily usage limits/);
  assert.equal(passDisplayCopy('Owner custom benefit'), 'Owner custom benefit');
  assert.equal(passDisplayCopy('80+ Interactive Formula Flashcards with rigorous step-by-step derivations'), 'Interactive formula flashcards with worked derivations');
  assert.equal(passDisplayCopy('100% 7-Day Money-Back Guarantee'), '100% 7-Day Money-Back Guarantee');
});

test('production diagnostic uses only bounded GET metadata and allowlists its output', async () => {
  const calls: string[] = [];
  const result = await inspectProductionResources({token: 'private-token', accountId: 'a'.repeat(32), request: async (input: any, options: any) => {
    const url = String(input);
    calls.push(url); assert.equal(options.method, 'GET'); assert.equal(options.redirect, 'manual'); assert.ok(options.signal);
    let data: any = [];
    if (url.endsWith('/settings')) data = { bindings: [{type:'r2_bucket', name:'MAYF_PDF_BUCKET', bucket_name:'mayf-study-materials'}, {type:'plain_text', name:'SECRET', text:'PRIVATE'}] };
    if (url.endsWith('/secrets')) data = [{name:'FIREBASE_SERVICE_ACCOUNT_JSON', value:'PRIVATE'}];
    if (url.endsWith('/mayf-study-materials')) data = {name:'mayf-study-materials', private:'PRIVATE'};
    if (url.endsWith('/domains')) data = [{hostname:'mayf.co.in',service:'mayf',environment:'production',zone_id:'PRIVATE'}, {hostname:'unrelated.example',service:'other'}];
    return new Response(JSON.stringify({success:true,result:data}));
  } });
  assert.equal(calls.length,4); assert.equal(result.r2BindingMatches,true); assert.equal(result.productionBucketPresent,true);
  assert.equal(result.requiredSecretPresence.FIREBASE_SERVICE_ACCOUNT_JSON,true);
  assert.equal(result.requiredSecretPresence.GEMINI_API_KEY,false);
  assert.equal(result.domains.length,1);
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE|private-token|unrelated/);
});

test('production metadata failures never become ready or leak provider bodies', async () => {
  const result = await inspectProductionResources({token:'private',accountId:'a'.repeat(32),request: async () => new Response('SECRET PROVIDER BODY',{status:403})});
  assert.equal(result.metadataStatus,403); assert.equal(result.productionBucketPresent,false);
  assert.equal(result.r2BindingMatches,false); assert.equal(result.domains.length,0);
  assert.doesNotMatch(JSON.stringify(result), /SECRET PROVIDER BODY/);
});

test('rollback exercise is staging-only, opt-in and restores candidate before reporting a failed check', () => {
  const text = readFileSync(new URL('../.github/workflows/deploy-staging.yml',import.meta.url),'utf8');
  assert.match(text,/exercise_staging_rollback:[\s\S]*?default: false/);
  assert.match(text,/rollback cdee813a-2f20-4a2a-a520-10fafb0e202d --config wrangler.staging.jsonc --yes/);
  assert.ok(text.indexOf('Require successful rollback check') > text.indexOf('Deploy ONLY isolated staging Worker\n'));
  assert.match(text,/continue-on-error: true/);
});
