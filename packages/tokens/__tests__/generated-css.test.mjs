import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

import {
  cmBreakpointTokenNames,
  cmBreakpointTokens,
  cmDarkThemePreset,
  cmLightThemePreset,
  serializeCmThemeTokensToCssVars,
} from '../dist/index.js';

const css = await readFile(new URL('../dist/tokens.css', import.meta.url), 'utf8');
const breakpointCss = await readFile(new URL('../dist/breakpoints.css', import.meta.url), 'utf8');

function parseDeclarations(source) {
  const declarations = [...source.matchAll(/(--cm-[a-z0-9-]+): ([^;]+);/g)].map((match) => [match[1], match[2]]);

  assert.equal(new Set(declarations.map(([name]) => name)).size, declarations.length);
  return Object.fromEntries(declarations);
}

test('generates the complete light theme and minimal dark overrides', () => {
  const [lightBlock, darkBlock] = css.split("\n\n[data-cm-theme='dark'] {");

  assert.equal(lightBlock.match(/ {2}--cm-/g)?.length, 228);
  assert.equal(darkBlock.match(/ {2}--cm-/g)?.length, 83);
  assert.match(css, /^@import '\.\/breakpoints\.css';/);
});

test('uses portable CodeMonster custom property names', () => {
  assert.match(css, /--cm-palette-neutral-0: oklch\(/);
  assert.match(css, /--cm-color-background-canvas: var\(--cm-palette-/);
  assert.match(css, /--cm-font-size-2xl: /);
  assert.match(css, /--cm-focus-ring-width: 3px;/);
  assert.match(css, /--cm-radius-control: calc\(var\(--cm-radius\) - 0\.125rem\);/);
  assert.match(css, /--cm-radius-surface: var\(--cm-radius\);/);
  assert.match(css, /--cm-shadow-surface: 0 1px 2px color-mix\(in srgb, var\(--cm-color-text-primary\) 4%, transparent\);/);
  assert.match(css, /--cm-motion-duration-fast: 220ms;/);
  assert.match(css, /--cm-motion-ease-standard: cubic-bezier\(0\.16, 1, 0\.3, 1\);/);
  assert.match(css, /--cm-button-padding-md: 0\.3125rem 0\.75rem;/);
  assert.match(css, /--cm-field-padding-lg: var\(--cm-field-padding-block-lg\) var\(--cm-field-padding-inline-lg\);/);
  assert.doesNotMatch(css, /--(?:vf|vueforge)-/);
  assert.doesNotMatch(css, /--cm-[^:]*[A-Z]/);
  assert.ok(css.endsWith('\n'));
});

test('generates portable breakpoint custom properties separately', () => {
  assert.equal(breakpointCss.match(/ {2}--cm-breakpoint-/g)?.length, 6);
  assert.match(breakpointCss, /--cm-breakpoint-xs: 480px;/);
  assert.match(breakpointCss, /--cm-breakpoint-2xl: 1536px;/);
  assert.doesNotMatch(breakpointCss, /@custom-media|--(?:vf|vueforge)-/);
  assert.ok(breakpointCss.endsWith('\n'));
});

test('matches the schema-backed serializer exactly', () => {
  const [lightBlock, darkBlock] = css.split("\n\n[data-cm-theme='dark'] {");
  const breakpointNames = new Set(cmBreakpointTokenNames);
  const lightTokens = Object.fromEntries(
    Object.entries(cmLightThemePreset.tokens).filter(([name]) => !breakpointNames.has(name)),
  );
  const darkOverrides = Object.fromEntries(
    Object.entries(cmDarkThemePreset.tokens).filter(([name, value]) => cmLightThemePreset.tokens[name] !== value),
  );

  assert.deepEqual(parseDeclarations(lightBlock), serializeCmThemeTokensToCssVars(lightTokens));
  assert.deepEqual(parseDeclarations(darkBlock), serializeCmThemeTokensToCssVars(darkOverrides));
  assert.deepEqual(parseDeclarations(breakpointCss), serializeCmThemeTokensToCssVars(cmBreakpointTokens));
});

test('resolves every generated custom property reference', () => {
  const [lightBlock, darkBlock] = css.split("\n\n[data-cm-theme='dark'] {");
  const baseDeclarations = {
    ...parseDeclarations(breakpointCss),
    ...parseDeclarations(lightBlock),
  };
  const darkDeclarations = parseDeclarations(darkBlock);

  for (const value of [...Object.values(baseDeclarations), ...Object.values(darkDeclarations)]) {
    for (const [, reference] of value.matchAll(/var\((--cm-[a-z0-9-]+)\)/g)) {
      assert.ok(reference in baseDeclarations, `Unknown generated CSS variable: ${reference}`);
    }
  }
});
