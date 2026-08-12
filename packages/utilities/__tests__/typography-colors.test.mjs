import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

import { cmSemanticColorTokenNames, cmTypographyTokenNames } from '@codemonster-ru/ui-tokens';
import { colorUtilities, typographyUtilities } from '../src/contract.mjs';

const css = await readFile(new URL('../dist/utilities.css', import.meta.url), 'utf8');

test('generates the approved token-backed typography utilities', () => {
  assert.equal(Object.keys(typographyUtilities).length, cmTypographyTokenNames.length);
  assert.deepEqual(typographyUtilities['font-heading'], { 'font-family': 'var(--cm-font-family-heading)' });
  assert.deepEqual(typographyUtilities['text-2xl'], { 'font-size': 'var(--cm-font-size-2xl)' });
  assert.deepEqual(typographyUtilities['leading-relaxed'], { 'line-height': 'var(--cm-line-height-relaxed)' });
});

test('limits color utilities to approved semantic roles', () => {
  assert.equal(Object.keys(colorUtilities).length, 14);
  assert.deepEqual(colorUtilities['text-primary'], { color: 'var(--cm-color-text-primary)' });
  assert.deepEqual(colorUtilities['bg-surface-subtle'], {
    background: 'var(--cm-color-background-surface-subtle)',
  });
  assert.deepEqual(colorUtilities['border-divider'], { 'border-color': 'var(--cm-color-border-divider)' });
});

test('references only owned typography and semantic color tokens', () => {
  const approvedTokenNames = new Set([...cmTypographyTokenNames, ...cmSemanticColorTokenNames]);
  const variables = new Set(
    Object.values({ ...typographyUtilities, ...colorUtilities })
      .flatMap((declarations) => Object.values(declarations))
      .map((value) => value.match(/var\((--cm-[a-z0-9-]+)\)/u)?.[1]),
  );

  const approvedVariables = new Set(
    [...approvedTokenNames].map((tokenName) =>
      tokenName
        .replaceAll(/([a-z0-9])([A-Z])/gu, '$1-$2')
        .replaceAll(/([a-zA-Z])(\d)/gu, '$1-$2')
        .toLowerCase()
        .replace(/^/u, '--cm-'),
    ),
  );
  assert.deepEqual(
    [...variables].filter((variable) => !approvedVariables.has(variable)),
    [],
  );

  for (const name of [...Object.keys(typographyUtilities), ...Object.keys(colorUtilities)]) {
    assert.equal(css.match(new RegExp(`\\.cm-${name} \\{`, 'gu'))?.length, 1, name);
  }
});
