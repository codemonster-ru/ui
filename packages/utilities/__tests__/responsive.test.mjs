import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

import { cmBreakpoints } from '@codemonster-ru/ui-tokens';
import { responsiveBreakpoints, responsiveUtilities } from '../src/contract.mjs';

const css = await readFile(new URL('../dist/utilities.css', import.meta.url), 'utf8');

test('uses only approved responsive breakpoints in token order', () => {
  assert.deepEqual(responsiveBreakpoints, {
    sm: cmBreakpoints.sm,
    md: cmBreakpoints.md,
    lg: cmBreakpoints.lg,
  });
  assert.deepEqual(
    [...css.matchAll(/@media \(min-width: (\d+)px\)/gu)].map((match) => Number(match[1])),
    Object.values(responsiveBreakpoints),
  );
});

test('generates every approved responsive layout and gap utility', () => {
  for (const breakpoint of Object.keys(responsiveBreakpoints)) {
    for (const name of Object.keys(responsiveUtilities)) {
      assert.equal(css.match(new RegExp(`\\.cm-${breakpoint}-${name} \\{`, 'gu'))?.length, 1, `${breakpoint}-${name}`);
    }
  }
});

test('does not generate responsive typography color border or spacing-axis utilities', () => {
  assert.doesNotMatch(css, /\.cm-(?:sm|md|lg)-(?:font|text|bg|border|rounded|m[trbesxy]?|p[trbesxy]?)-/u);
});
