import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import {FORMULA_CATEGORIES, FORMULA_DECK_ITEMS} from '../src/data/formulaDeckData';

const catalogue = FORMULA_DECK_ITEMS;
test('large formula collection preserves published routes and covers school and exam topics', () => {
  assert.ok(catalogue.length >= 1000);
  assert.equal(new Set(catalogue.map(f => f.id)).size, catalogue.length);
  assert.equal(new Set(catalogue.map(f => f.slug)).size, catalogue.length);
  for (const slug of ['simple-interest', 'compound-interest', 'pythagoras-theorem', 'trig-ratios-right-triangle']) {
    assert.ok(catalogue.some(f => f.slug === slug), `published route ${slug}`);
    assert.ok(catalogue.find(f => f.slug === slug)!.applicableClasses.includes('Competitive Exams'), `original formula included in exam revision: ${slug}`);
  }
  for (const category of FORMULA_CATEGORIES) {
    assert.ok(catalogue.some(f => f.category === category.id), category.id);
  }
  for (const level of ['Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12','Competitive Exams']) {
    assert.ok(catalogue.filter(f => f.applicableClasses.includes(level as any)).length >= 10, level);
  }
});

test('every formula has a valid display equation, identifier and usage note', () => {
  const categories = new Set(FORMULA_CATEGORIES.map(category => category.id));
  for (const f of catalogue) {
    assert.ok(categories.has(f.category as any), `filterable category: ${f.slug}`);
    assert.match(f.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(f.title.trim() && f.explanation.trim() && f.plainTextFormula.trim(), f.slug);
    assert.ok(f.applicableClasses.length && !f.applicableClasses.includes('All'), f.slug);
    assert.doesNotThrow(() => katex.renderToString(f.latexFormula, {throwOnError: true, strict: 'ignore'}), f.slug);
  }
});

// A deliberately small arithmetic parser, not eval(): exact-angle values contain
// only numbers, signs, square roots and fractions. This verifies the source
// values independently against the platform's radian trigonometric functions.
function constant(latex: string): number {
  let i = 0;
  const skip = () => {while (/\s/.test(latex[i] || '') && i < latex.length) i++;};
  const atom = (): number => {
    skip();
    if (latex[i] === '+') {i++; return atom();}
    if (latex[i] === '-') {i++; return -atom();}
    if (latex.startsWith('\\frac', i)) {i += 5; const top = atom(); return top / atom();}
    if (latex.startsWith('\\sqrt', i)) {i += 5; return Math.sqrt(atom());}
    if (latex[i] === '{' || latex[i] === '(') {
      const close = latex[i++] === '{' ? '}' : ')';
      const value = expression(); skip(); assert.equal(latex[i++], close); return value;
    }
    const number = latex.slice(i).match(/^\d+(?:\.\d+)?/);
    assert.ok(number, `unexpected numeric LaTeX ${latex.slice(i)}`); i += number[0].length; return Number(number[0]);
  };
  const product = (): number => {
    let value = atom(); skip();
    while (latex[i] === '\\' || latex[i] === '{' || latex[i] === '(' || /[0-9]/.test(latex[i] || '')) {value *= atom(); skip();}
    return value;
  };
  const expression = (): number => {
    let result = product(); skip();
    while (latex[i] === '+' || latex[i] === '-') {
      const op = latex[i++]; const rhs = product(); result = op === '+' ? result + rhs : result - rhs; skip();
    }
    return result;
  };
  const value = expression(); skip(); assert.equal(i, latex.length); return value;
}

test('every exact standard-angle reference matches an independent numeric calculation', () => {
  const trig = {sin: Math.sin, cos: Math.cos, tan: Math.tan, cot: (x: number) => 1/Math.tan(x), sec: (x: number) => 1/Math.cos(x), csc: (x: number) => 1/Math.sin(x)};
  const values = catalogue.filter(f => f.tags?.[0] === 'standard-angle-values');
  assert.ok(values.length >= 120);
  for (const f of values) {
    const match = f.title.match(/^(sin|cos|tan|cot|sec|csc) of (\d+) degrees$/)!;
    const expected = trig[match[1] as keyof typeof trig](Number(match[2])*Math.PI/180);
    const actual = constant(f.latexFormula.split('=')[1]);
    assert.ok(Math.abs(actual-expected) < 1e-9, `${f.title}: ${actual} vs ${expected}`);
  }
});

test('domain-sensitive reference cards retain essential restrictions', () => {
  for (const [title, condition] of [
    ['Infinite geometric sum', '|r|<1'],
    ['Power antiderivative', 'n\\ne-1'],
    ['Quadratic discriminant', 'a ≠ 0'],
    ['Conditional probability', 'strictly positive'],
    ['Inverse using adjugate', 'nonzero'],
    ['Arctangent addition with branch condition', 'xy<1'],
  ]) {
    const f = catalogue.find(f => f.title === title)!;
    assert.ok(f, title);
    assert.ok((f.latexFormula + f.explanation).includes(condition), title);
  }
});


test('global search and suggestions include the expanded reference collection during catalogue outages', async t => {
  const originalFetch = globalThis.fetch;
  t.after(() => {globalThis.fetch = originalFetch;});
  globalThis.fetch = async () => new Response(JSON.stringify({error: 'Catalogue unavailable'}), {status: 503});
  const {LightweightSearchService} = await import('../src/lib/search/lightweightSearchService');
  const service = new LightweightSearchService();
  const results = await service.search({query: 'Integral of natural exponential', categoryId: 'Integration'});
  assert.ok(results.some(result => result.url === '/formula/reference-integral-of-natural-exponential'));
  const suggestions = await service.autocomplete('hypergeometric');
  assert.ok(suggestions.some(suggestion => suggestion === 'Hypergeometric probability'));
});

test('copy/search text preserves fractions and root grouping', async () => {
  const {formulaPlainText} = await import('../src/data/formulas/expandedFormulaDeck');
  assert.equal(formulaPlainText('\\frac1{\\sqrt{1-x^2}}'), '(1)/(sqrt(1-x^2))');
  assert.equal(formulaPlainText('x^{n+1}'), 'x^(n+1)');
  assert.equal(formulaPlainText('\\frac{a+b}{c+d}'), '(a+b)/(c+d)');
});
