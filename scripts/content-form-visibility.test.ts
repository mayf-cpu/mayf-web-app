import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareContentMetadata } from '../src/lib/cms/contentForm';
import { contentCmsManager } from '../src/lib/cms/contentManager';
import { filterCatalogue } from '../src/lib/catalogue/catalogueQuery';
const actor = { uid: 'qa-admin', email: 'qa@example.test', role: 'admin' as const };
test('saving a visible new resource publishes it into the public catalogue', () => {
  const payload = prepareContentMetadata({ title: 'Form visibility test', slug: 'form-visibility-test', status: 'draft' as const, visible: true, contentType: 'other' as const, accessType: 'free' as const }, true);
  const created = contentCmsManager.createItem(payload, actor);
  assert.equal(created.status, 'published');
  assert.equal(created.sourceDriveId, '');
  assert.equal(filterCatalogue([created], {}, null, 20).items.length, 1);
  const hidden = contentCmsManager.updateItem(created.id, prepareContentMetadata({ visible: false }, false), actor);
  assert.equal(filterCatalogue([hidden], {}, null, 20).items.length, 0);
});
