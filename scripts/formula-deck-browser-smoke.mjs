import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {createServer} from 'vite';
const {chromium} = await import(pathToFileURL(process.env.MAYF_PLAYWRIGHT_MODULE).href);
const server = await createServer({server: {host: '127.0.0.1', port: 5124, strictPort: true}});
let browser;
try {
  await server.listen();
  browser = await chromium.launch({headless: true});
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // Exercise local formula browsing without live accounts or production APIs.
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname !== '127.0.0.1') return route.abort();
    if (url.pathname.startsWith('/api/')) return route.fulfill({status: 503, contentType: 'application/json', body: '{"error":"Offline catalogue test"}'});
    return route.continue();
  });
  await page.goto('http://127.0.0.1:5124/formula-deck');
  await page.getByRole('heading', {name: 'Formula Deck', exact: true}).waitFor();
  // Development uses a fresh demo student; dismiss that student's first-visit tour.
  await page.getByRole('button', {name: 'Close tour', exact: true}).click();
  await page.getByRole('dialog').waitFor({state: 'hidden'});
  const category = page.getByLabel('Formula Category', {exact: true});
  const standard = page.getByLabel('Formula Standard or Exam', {exact: true});
  const topic = page.getByLabel('Formula Topic', {exact: true});
  assert.equal(await category.locator('option').count(), 26);
  assert.equal(await standard.locator('option').count(), 10);
  for (const width of [375, 1280]) {
    await page.setViewportSize({width, height: 900});
    for (const select of [category, standard, topic]) {
      const box = await select.boundingBox();
      assert.ok(box.x >= 0 && box.x+box.width <= width+1, 'dropdown fits screen');
    }
  }
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="formula-grid"] h3').length === 24);
  const firstTitle = await page.getByTestId('formula-grid').locator('h3').first().textContent();
  await page.getByRole('button', {name: 'Next', exact: true}).click();
  await page.waitForFunction(first => document.querySelector('[data-testid="formula-grid"] h3').textContent !== first, firstTitle);
  await standard.selectOption('Class 12');
  await category.selectOption('Integration');
  await page.getByLabel('Search formulas', {exact: true}).fill('leading arctangent');
  await page.getByRole('heading', {name: 'Integral leading to arctangent', exact: true}).waitFor();
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="formula-grid"] h3').length === 1);
  assert.ok(await page.locator('[data-testid="formula-grid"] .katex').count());
  await page.getByRole('link', {name: 'Integral leading to arctangent', exact: true}).click();
  await page.waitForURL('**/formula/reference-integral-leading-to-arctangent');
  await page.getByRole('heading', {name: 'Integral leading to arctangent', exact: true}).waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS: full Formula Deck route, dropdowns, viewport fit, pagination, grade/category/search filters, LaTeX and detail URL');
} finally {
  await browser?.close();
  await server.close();
}
