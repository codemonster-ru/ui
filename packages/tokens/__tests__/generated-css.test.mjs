import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const css = await readFile(new URL('../dist/tokens.css', import.meta.url), 'utf8');

test('generates the complete light theme and minimal dark overrides', () => {
  const [lightBlock, darkBlock] = css.split("\n\n[data-cm-theme='dark'] {");

  assert.equal(lightBlock.match(/ {2}--cm-/g)?.length, 206);
  assert.equal(darkBlock.match(/ {2}--cm-/g)?.length, 83);
});

test('uses portable CodeMonster custom property names', () => {
  assert.match(css, /--cm-palette-neutral-0: oklch\(/);
  assert.match(css, /--cm-color-background-canvas: var\(--cm-palette-/);
  assert.match(css, /--cm-font-size-2xl: /);
  assert.match(css, /--cm-breakpoint-2xl: 1536px;/);
  assert.doesNotMatch(css, /--(?:vf|vueforge)-/);
  assert.doesNotMatch(css, /--cm-[^:]*[A-Z]/);
  assert.ok(css.endsWith('\n'));
});
