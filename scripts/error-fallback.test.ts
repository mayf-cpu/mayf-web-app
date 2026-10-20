import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ErrorPage } from '../src/pages/ErrorPage';
test('the root error fallback renders without navigation or authentication providers', () => {
  const html = renderToStaticMarkup(createElement(ErrorPage, { error: new Error('Failed to fetch dynamically imported module'), onReset: () => {} }));
  assert.match(html, /Reload page/);
  assert.match(html, /website may have been updated/);
  assert.match(html, /href="\/"/);
  assert.doesNotMatch(html, /useNavigation|Failed to fetch dynamically imported/);
});
