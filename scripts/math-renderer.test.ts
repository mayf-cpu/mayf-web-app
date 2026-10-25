import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MathRenderer} from '../src/components/ui/MathRenderer';
const render=(content:string)=>renderToStaticMarkup(React.createElement(MathRenderer,{content}));
test('AI block math supports dollar and bracket delimiters surrounded by prose',()=>{
 for(const content of [String.raw`Before $$\frac{1}{2} + \sqrt{x}$$ after`,String.raw`Before \[\frac{1}{2} + \sqrt{x}\] after`]){
  const html=render(content);assert.match(html,/math-display/);assert.match(html,/class="mfrac"/);assert.match(html,/Before/);assert.match(html,/after/);assert.doesNotMatch(html,/katex-error/);
 }
});
test('inline math also renders inside bold text and headings, with multiline aligned equations',()=>{
 const html=render(String.raw`### Solve **$x^2$**
Use **\(x=2\)**.
\[
\begin{aligned} 2x + 5 &= 13 \\ x &= 4 \end{aligned}
\]`);
 assert.equal((html.match(/class="katex"/g)||[]).length,3);assert.doesNotMatch(html,/katex-error/);assert.match(html,/Solve/);
});
test('code examples and HTML are kept as escaped text without running markup',()=>{
 const html=render('```tex\n\\[x^2\\]\n```\n<img src=x onerror=alert(1)>\n`$x$`');
 assert.match(html,/<pre/);assert.doesNotMatch(html,/class="katex"|<img/);assert.match(html,/&lt;img/);
});

test('worked examples typeset every step instead of showing raw LaTeX commands',async()=>{
 const {StepProblemCard}=await import('../src/components/ui/StepProblemCard');
 const {INITIAL_SOLVED_PROBLEMS}=await import('../src/data/curriculumData');
 const html=renderToStaticMarkup(React.createElement(StepProblemCard,{problem:INITIAL_SOLVED_PROBLEMS[0],defaultExpanded:true}));
 assert.equal((html.match(/class="katex"/g)||[]).length,4);assert.doesNotMatch(html,/katex-error/);assert.match(html,/class="mfrac"/);
});
