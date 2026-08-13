import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

import { flexUtilities, gridUtilities } from '../src/contract.mjs';

const css = await readFile(new URL('../dist/utilities.css', import.meta.url), 'utf8');

test('generates the approved flex and grid utility classes once', () => {
  for (const name of [...Object.keys(flexUtilities), ...Object.keys(gridUtilities)]) {
    assert.equal(css.match(new RegExp(`\\.cm-${name} \\{`, 'gu'))?.length, 1, name);
  }
});

test('serializes every flex and grid declaration from the contract', () => {
  for (const [name, declarations] of Object.entries({ ...flexUtilities, ...gridUtilities })) {
    for (const [property, value] of Object.entries(declarations)) {
      const escapedValue = value.replaceAll('(', '\\(').replaceAll(')', '\\)');
      assert.match(css, new RegExp(`\\.cm-${name} \\{[^}]*${property}: ${escapedValue};`, 'u'));
    }
  }
});
