import assert from 'node:assert/strict';
import test from 'node:test';
import { downloadCards } from '../src/lib/download/downloadCatalogue';
test('student download cards use only published downloadable CMS PDFs with genuine IDs', () => {
  const row = { id: 'cms-real', title: 'Real PDF', visible: true, status: 'published', contentType: 'pdf', downloadAllowed: true, classLevels: ['Class 10'] };
  const result = downloadCards([row, { ...row, status: 'draft' }, { ...row, visible: false },
    { ...row, isDeleted: true }, { ...row, contentType: 'video' }, { ...row, downloadAllowed: false }]);
  assert.equal(result.length, 1); assert.equal(result[0].id, 'cms-real');
  assert.equal(result[0].pages, undefined); assert.equal(result[0].fileSize, 'PDF');
  assert.deepEqual(downloadCards([]), []); assert.throws(() => downloadCards({}));
});
