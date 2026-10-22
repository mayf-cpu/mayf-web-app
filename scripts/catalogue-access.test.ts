import test from 'node:test';
import assert from 'node:assert/strict';
import { canReadPremiumContent, publicContent } from '../src/lib/catalogue/catalogueAccess';
const item = { id: 'paid', accessType: 'paid', files: [{ url: 'https://example.test/private.pdf' }], embedUrl: 'https://example.test/private.mp4', galleryImages: ['private-image'], sourceDriveId: 'private-drive', sales: { revenue: 1 } };
test('anonymous and expired members do not receive premium file locations', () => {
  assert.equal(canReadPremiumContent(null, true), false);
  assert.equal(canReadPremiumContent({ valid: false, admin: true }, true), false);
  assert.equal(canReadPremiumContent({ valid: true, annualPass: true, annualPassExpiry: '2020-01-01' }, true), false);
  assert.deepEqual(publicContent(item).files, []);
  assert.equal(publicContent(item).embedUrl, '');
  assert.deepEqual(publicContent(item).galleryImages, []);
});
test('verified members can receive permitted assets without private CMS metadata', () => {
  assert.equal(canReadPremiumContent({ valid: true, annualPass: true, annualPassExpiry: '2099-01-01' }, true), true);
  assert.equal(canReadPremiumContent({ valid: true, annualPass: true }, false), false);
  assert.equal(canReadPremiumContent({ valid: true, admin: true }, false), true);
  assert.equal(canReadPremiumContent({ valid: true, pro: true }, false), true);
  assert.deepEqual(publicContent(item, true).files, item.files);
  assert.equal(publicContent(item, true).sourceDriveId, undefined);
  assert.equal(publicContent(item, true).sales, undefined);
  assert.deepEqual(publicContent({ ...item, accessType: 'free' }).files, item.files);
});
