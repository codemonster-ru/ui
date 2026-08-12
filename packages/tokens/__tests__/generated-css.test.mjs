import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const css = await readFile(new URL('../dist/tokens.css', import.meta.url), 'utf8');
const breakpointCss = await readFile(new URL('../dist/breakpoints.css', import.meta.url), 'utf8');

test('generates the complete light theme and minimal dark overrides', () => {
  const [lightBlock, darkBlock] = css.split("\n\n[data-cm-theme='dark'] {");

  assert.equal(lightBlock.match(/ {2}--cm-/g)?.length, 200);
  assert.equal(darkBlock.match(/ {2}--cm-/g)?.length, 83);
  assert.match(css, /^@import '\.\/breakpoints\.css';/);
});

test('uses portable CodeMonster custom property names', () => {
  assert.match(css, /--cm-palette-neutral-0: oklch\(/);
  assert.match(css, /--cm-color-background-canvas: var\(--cm-palette-/);
  assert.match(css, /--cm-font-size-2xl: /);
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
