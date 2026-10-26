import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {createServer} from 'vite';

const modulePath = process.env.MAYF_PLAYWRIGHT_MODULE;
if (!modulePath) throw new Error('Set MAYF_PLAYWRIGHT_MODULE to the installed playwright/index.mjs path.');
const {chromium} = await import(pathToFileURL(modulePath).href);
const server = await createServer({server: {host: '127.0.0.1', port: 5123, strictPort: true}});
let browser;
try {
  await server.listen();
  browser = await chromium.launch({headless: true});
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:5123/scripts/browser/math-editor.html');
  const field = page.locator('math-field');
  await field.waitFor();
  await page.waitForFunction(() => document.querySelector('math-field')?.shadowRoot?.querySelector('.ML__content'));
  assert.equal(await field.count(), 1, 'StrictMode remount leaves one editor');
  for (const width of [375, 1024]) {
    await page.setViewportSize({width, height: 800});
    const icon = await page.getByRole('button', {name: 'Upload question image'}).boundingBox();
    const editor = await field.boundingBox();
    assert.ok(Math.abs(icon.y + icon.height / 2 - editor.y - editor.height / 2) < 2, 'upload and editor aligned');
    assert.ok(editor.x + editor.width <= width, 'editor fits mobile/desktop viewport');
  }
  await page.getByRole('button', {name: 'Fraction', exact: true}).click();
  assert.match(await page.getByTestId('value').textContent(), /\\frac/);
  await field.locator('.ML__frac-line').waitFor({state: 'attached', timeout: 5000});
  await field.evaluate(editor => {editor.executeCommand('selectAll'); editor.insert('\\frac{3}{4}', {mode: 'math'});});
  await page.waitForFunction(() => document.querySelector('math-field').value.includes('3'));
  await page.getByRole('button', {name: 'Root', exact: true}).click();
  await field.locator('.ML__sqrt-sign').waitFor({state: 'attached', timeout: 5000});
  await field.press('Enter');
  await page.waitForFunction(() => document.querySelector('[data-testid="sent"]').textContent.includes('3'));
  assert.equal(await field.evaluate(editor => editor.value), '', 'send clears editor');
  await field.click();
  await page.keyboard.type('Please solve ');
  assert.match(await field.evaluate(editor => editor.value), /Please solve/);
  await page.getByRole('button', {name: 'Power', exact: true}).click();
  assert.match(await field.evaluate(editor => editor.value), /x\^2/);
  await page.getByRole('button', {name: 'Toggle disabled'}).click();
  assert.equal(await field.evaluate(editor => editor.readOnly), true);
  assert.deepEqual(errors, [], 'no runtime exception while mounting/editing');
  console.log('PASS: editor mount/remount, alignment, rendered math, editing, prose, submit/clear and readonly');
} catch (error) {
  for (const page of browser?.contexts().flatMap(context => context.pages()) ?? []) {
    console.error(await page.locator('math-field').evaluate(editor => ({value: editor.value, html: editor.shadowRoot.innerHTML})));
  }
  throw error;
} finally {
  await browser?.close();
  await server.close();
}
