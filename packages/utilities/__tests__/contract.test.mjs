import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';
import { gzipSync } from 'node:zlib';

import {
  borderUtilities,
  colorUtilities,
  displayUtilities,
  flexUtilities,
  gridUtilities,
  responsiveBreakpoints,
  responsiveUtilities,
  sizingUtilities,
  spacingUtilities,
  typographyUtilities,
} from '../src/contract.mjs';

const css = await readFile(new URL('../dist/utilities.css', import.meta.url), 'utf8');
const tokenCss = await Promise.all([
  readFile(new URL('../../tokens/dist/tokens.css', import.meta.url), 'utf8'),
  readFile(new URL('../../tokens/dist/breakpoints.css', import.meta.url), 'utf8'),
]);

test('resolves every generated token reference', () => {
  const declared = new Set(tokenCss.join('\n').match(/--cm-[a-z0-9-]+(?=:)/gu) ?? []);
  const referenced = new Set(css.match(/--cm-[a-z0-9-]+(?=\))/gu) ?? []);

  assert.ok(referenced.size > 0);
  assert.deepEqual(
    [...referenced].filter((name) => !declared.has(name)),
    [],
  );
});

test('emits the exact utility contract without duplicate selectors', () => {
  const baseUtilities = {
    ...displayUtilities,
    ...flexUtilities,
    ...gridUtilities,
    ...spacingUtilities,
    ...sizingUtilities,
    ...typographyUtilities,
    ...colorUtilities,
    ...borderUtilities,
  };
  const expectedCount =
    Object.keys(baseUtilities).length +
    Object.keys(responsiveBreakpoints).length * Object.keys(responsiveUtilities).length;
  const classes = [...css.matchAll(/\.cm-[a-z0-9-]+(?= \{)/gu)].map(([name]) => name);

  assert.equal(classes.length, expectedCount);
  assert.equal(new Set(classes).size, classes.length);
  assert.equal(css.match(/@layer cm-utilities/gu)?.length, 1);
});

test('stays inside the approved utility CSS package budget', () => {
  assert.ok(Buffer.byteLength(css) <= 256 * 1024, 'raw CSS exceeds 256 KiB');
  assert.ok(gzipSync(css).byteLength <= 32 * 1024, 'gzip CSS exceeds 32 KiB');
});
