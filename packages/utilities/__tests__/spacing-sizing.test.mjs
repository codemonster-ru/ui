import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

import { cmSizingTokenNames, cmSpacingTokenNames } from '@codemonster-ru/ui-tokens';
import { sizingUtilities, spacingUtilities } from '../src/contract.mjs';

const css = await readFile(new URL('../dist/utilities.css', import.meta.url), 'utf8');

test('generates logical spacing families for every spacing token', () => {
  assert.equal(Object.keys(spacingUtilities).length, cmSpacingTokenNames.length * 17);
  assert.deepEqual(spacingUtilities['mx-4'], { 'margin-inline': 'var(--cm-space-4)' });
  assert.deepEqual(spacingUtilities['py-8'], { 'padding-block': 'var(--cm-space-8)' });
  assert.deepEqual(spacingUtilities['column-gap-3'], { 'column-gap': 'var(--cm-space-3)' });
});

test('generates static and token-backed sizing families', () => {
  assert.equal(Object.keys(sizingUtilities).length, cmSizingTokenNames.length + 3);
  assert.deepEqual(sizingUtilities['h-control-lg'], { 'block-size': 'var(--cm-control-height-lg)' });
  assert.deepEqual(sizingUtilities['size-icon-xl'], {
    'block-size': 'var(--cm-icon-size-xl)',
    'inline-size': 'var(--cm-icon-size-xl)',
  });
});

test('serializes all spacing and sizing contract entries', () => {
  for (const [name, declarations] of Object.entries({ ...spacingUtilities, ...sizingUtilities })) {
    assert.equal(css.match(new RegExp(`\\.cm-${name} \\{`, 'gu'))?.length, 1, name);
    for (const [property, value] of Object.entries(declarations)) {
      assert.ok(css.includes(`${property}: ${value};`), `${name} must use ${property}: ${value}.`);
    }
  }
});
