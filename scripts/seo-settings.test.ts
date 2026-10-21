import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SEO_SETTINGS, validateSeoSettings } from '../src/lib/seo/seoSettings';
import { sitemapService } from '../src/lib/seo/sitemapService';
import { contentCmsManager } from '../src/lib/cms/contentManager';

test('SEO settings accept only a clean HTTPS origin and bounded nonempty metadata', () => {
  assert.equal(validateSeoSettings({ ...DEFAULT_SEO_SETTINGS, canonicalDomain: 'https://mayf.co.in/' }).canonicalDomain, 'https://mayf.co.in');
  for (const canonicalDomain of ['javascript:alert(1)', 'http://example.com', 'https://example.com/private', 'https://user:password@example.com', 'https://example.com/?token=private']) assert.throws(() => validateSeoSettings({ ...DEFAULT_SEO_SETTINGS, canonicalDomain }));
  assert.throws(() => validateSeoSettings({ ...DEFAULT_SEO_SETTINGS, defaultTitle: '' }));
});
test('sitemap lists current public resources without restoring hidden seed chapters', () => {
  const original = contentCmsManager.exportState();
  try {
    const first = original[0];
    contentCmsManager.importState([{ ...first, visible: false, status: 'hidden' }, { ...first, id: 'qa-sitemap', slug: 'qa-public-sitemap', visible: true, status: 'published' }]);
    const xml = sitemapService.generateSitemapXml('https://mayf.co.in');
    assert.match(xml, /qa-public-sitemap/);
    assert.equal(xml.includes(`/study/${encodeURIComponent(first.slug)}</loc>`), false);
  } finally { contentCmsManager.importState(original); }
});
