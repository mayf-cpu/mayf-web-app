import assert from 'node:assert/strict';
import { test } from 'node:test';
import { contentCmsManager } from '../src/lib/cms/contentManager';

test('CMS lists and sorts imported PDFs without presentation counters or sales', () => {
  const original = contentCmsManager.exportState();
  const imported = {
    id: 'imported-pdf', title: 'Algebra', slug: 'algebra', categoryId: 'Algebra',
    contentType: 'pdf', classLevels: ['Class 8'], accessType: 'free',
    visible: true, status: 'published', isDeleted: false,
    viewCount: 12, downloadCount: 3, updatedAt: '2026-10-24T00:00:00Z',
    files: [{ url: 'r2://mayf-study-materials/pdf/imported-pdf/real.pdf' }],
  };
  try {
    contentCmsManager.importState([imported, { ...imported, id: 'empty', viewCount: undefined, downloadCount: undefined },
      { ...imported, id: 'invalid', views: -1, downloads: Number.NaN, sales: { revenue: Infinity } }]);
    const beforeRead = contentCmsManager.exportState();
    for (const sortBy of ['views', 'downloads', 'sales'] as const) {
      const result = contentCmsManager.getItems({ sortBy });
      assert.equal(result.counts.published, 3);
      for (const row of result.items) {
        assert.doesNotThrow(() => row.views.toLocaleString());
        assert.doesNotThrow(() => row.downloads.toLocaleString());
        assert.deepEqual(row.sales, { orderCount: 0, revenue: 0 });
      }
      if (sortBy !== 'sales') assert.equal(result.items[0].views, 12);
    }
    const row = contentCmsManager.getItem('imported-pdf')!;
    assert.equal(row.views, 12);
    assert.equal(row.downloads, 3);
    assert.deepEqual(row.files, imported.files);
    assert.equal(contentCmsManager.getItem('empty')!.views, 0);
    assert.deepEqual(contentCmsManager.exportState(), beforeRead, 'display defaults must not rewrite stored records');
  } finally {
    contentCmsManager.importState(original);
  }
});
