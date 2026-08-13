import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

import { displayUtilities } from '../src/contract.mjs';

const css = await readFile(new URL('../dist/utilities.css', import.meta.url), 'utf8');

test('generates every approved display utility exactly once', () => {
  const classes = [...css.matchAll(/\.(cm-[a-z0-9-]+) \{/gu)].map((match) => match[1]);

  for (const className of Object.keys(displayUtilities).map((name) => `cm-${name}`)) {
    assert.equal(classes.filter((candidate) => candidate === className).length, 1);
  }
});

test('maps display utility names to their declared values', () => {
  for (const [name, declarations] of Object.entries(displayUtilities)) {
    assert.match(css, new RegExp(`\\.cm-${name} \\{[^}]*display: ${declarations.display};`, 'u'));
  }
});
