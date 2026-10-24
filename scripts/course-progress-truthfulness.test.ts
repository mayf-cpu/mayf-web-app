import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CourseProgress } from '../src/components/ui/CourseProgress';

test('absent or invalid learner records never invent course completion', () => {
  for (const completedChapters of [undefined, NaN, -1, 21, 1.5]) {
    const html = renderToStaticMarkup(React.createElement(CourseProgress, { completedChapters, totalChapters: 20 }));
    assert.match(html, /No verified completion record/); assert.doesNotMatch(html, /role="progressbar"/);
  }
});
test('a verified learner count renders accurate accessible completion', () => {
  const html = renderToStaticMarkup(React.createElement(CourseProgress,{completedChapters:6,totalChapters:20}));
  assert.match(html,/aria-valuenow="6"/);assert.match(html,/aria-valuemax="20"/);assert.match(html,/30%/);
});
