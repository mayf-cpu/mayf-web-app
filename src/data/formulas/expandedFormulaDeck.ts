import type {FormulaItem, FormulaLevel} from '../../lib/firebase/types';
import {EXTENDED_FORMULA_GROUPS} from './formulaCatalogue';

const symbols: Record<string, string> = {
  pi: 'π', theta: 'θ', alpha: 'α', beta: 'β', gamma: 'γ', lambda: 'λ', mu: 'μ', sigma: 'σ',
  Delta: 'Δ', infty: '∞', times: '×', cdot: '·', div: '÷', pm: '±', le: '≤', ge: '≥', ne: '≠',
  cup: '∪', cap: '∩', subset: '⊂', subseteq: '⊆', in: '∈', notin: '∉', implies: '⇒', iff: '⇔',
  sum: 'Σ', prod: 'Π', int: '∫', partial: '∂', sqrt: '√', varnothing: '∅', to: '→',
};

// The displayed expression remains LaTeX. This simpler copy/search version is
// supplementary; the full expression is also indexed by the deck search.
export function formulaPlainText(latex: string): string {
  let i = 0;
  const skipSpaces = () => {while (i < latex.length && /\s/.test(latex[i])) i++;};
  const group = (): string => {
    skipSpaces();
    if (latex[i] === '{') {i++; return scan(true);}
    if (latex[i] === '\\') return command();
    return latex[i++] || '';
  };
  const command = (): string => {
    i++;
    if (latex[i] === '\\') {i++; return '; ';}
    const name = latex.slice(i).match(/^[A-Za-z]+/)?.[0];
    if (!name) return latex[i++] || '';
    i += name.length;
    if (name === 'frac') {const top = group(); return `(${top})/(${group()})`;}
    if (name === 'sqrt') {
      skipSpaces(); let index = '';
      if (latex[i] === '[') {const end = latex.indexOf(']', ++i); if (end !== -1) {index = latex.slice(i, end); i = end+1;}}
      return `${index ? `root[${index}]` : 'sqrt'}(${group()})`;
    }
    if (['text','operatorname','mathrm','mathbb','mathcal'].includes(name)) return group();
    if (['vec','hat','overline','bar'].includes(name)) return `${name}(${group()})`;
    if (name === 'begin') {const environment = group(); return environment.includes('matrix') ? '(' : `${environment}(`;}
    if (name === 'end') {group(); return ')';}
    if (name === 'left' || name === 'right') return '';
    if (name === 'quad' || name === 'qquad') return ' ';
    return symbols[name] || name;
  };
  const scan = (braced = false): string => {
    let result = '';
    while (i < latex.length) {
      if (latex[i] === '}' && braced) {i++; break;}
      if (latex[i] === '\\') result += command();
      else if (latex[i] === '{') {i++; result += `(${scan(true)})`;}
      else result += latex[i++];
    }
    return result;
  };
  return scan().replace(/\s+/g, ' ').trim();
}

export const EXPANDED_FORMULA_ITEMS: FormulaItem[] = EXTENDED_FORMULA_GROUPS.flatMap(group =>
  group.entries.map(([title, latex, explanation, example]) => {
    const slug = `reference-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
    return {
      id: slug, slug, title,
      category: group.category as FormulaItem['category'],
      applicableClasses: group.levels as FormulaLevel[],
      latexFormula: latex,
      plainTextFormula: formulaPlainText(latex),
      variables: group.variables,
      explanation,
      ...(example ? {example} : {}),
      tags: group.tags,
      isProOnly: false,
      watermarkGlyph: '∑',
      seo: {title: `${title} – Formula & Conditions | MAYF`, description: explanation},
    };
  })
);
