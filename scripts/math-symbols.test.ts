import test from 'node:test';
import assert from 'node:assert/strict';
import {validateLatex, convertLatexToMarkup, convertLatexToMathMl} from 'mathlive';
import {MATH_SYMBOL_GROUPS} from '../src/lib/ai/mathSymbols';

test('every picker symbol is supported by the visual math editor', () => {
  for (const group of MATH_SYMBOL_GROUPS) {
    for (const symbol of group.symbols) {
      assert.deepEqual(validateLatex(symbol.value), [], `${group.name}: ${symbol.name}`);
      assert.ok(convertLatexToMarkup(symbol.value), symbol.name);
    }
  }
});

test('fractions, roots and powers produce structured equations', () => {
  const symbols = MATH_SYMBOL_GROUPS.flatMap(group => group.symbols);
  for (const [name, tag] of [['fraction', 'mfrac'], ['square root', 'msqrt'], ['square', 'msup']]) {
    const symbol = symbols.find(symbol => symbol.name === name)!;
    assert.match(convertLatexToMathMl(symbol.value), new RegExp(`<${tag}`));
  }
});
