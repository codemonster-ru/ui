import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

import { borderUtilities } from '../src/contract.mjs';

const css = await readFile(new URL('../dist/utilities.css', import.meta.url), 'utf8');

test('covers every border width and radius token', () => {
  assert.deepEqual(Object.keys(borderUtilities), [
    'border',
    'border-thick',
    'border-0',
    'rounded-control',
    'rounded-control-tight',
    'rounded-surface',
    'rounded-overlay',
    'rounded-round',
  ]);
  assert.deepEqual(borderUtilities.border, { 'border-width': 'var(--cm-border-width)' });
  assert.deepEqual(borderUtilities['border-thick'], { 'border-width': 'var(--cm-border-width-thick)' });
  assert.deepEqual(borderUtilities['rounded-control-tight'], {
    'border-radius': 'var(--cm-radius-control-tight)',
  });
  assert.deepEqual(borderUtilities['rounded-round'], { 'border-radius': 'var(--cm-radius-round)' });
});

test('generates each approved border utility once', () => {
  for (const [name, declarations] of Object.entries(borderUtilities)) {
    assert.equal(css.match(new RegExp(`\\.cm-${name} \\{`, 'gu'))?.length, 1, name);
    for (const [property, value] of Object.entries(declarations)) {
      assert.ok(css.includes(`${property}: ${value};`));
    }
  }
});
