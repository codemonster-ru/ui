import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const controlCss = await readFile(new URL('../dist/primitives/control.css', import.meta.url), 'utf8');
const surfaceCss = await readFile(new URL('../dist/primitives/surface.css', import.meta.url), 'utf8');

test('ships token-backed control geometry and sizes', () => {
  assert.match(controlCss, /\.cm-control \{/);
  assert.match(controlCss, /min-block-size: var\(--cm-control-height-md\);/);
  assert.match(controlCss, /\.cm-control--sm[\s\S]*--cm-control-height-sm/);
  assert.match(controlCss, /\.cm-control--lg[\s\S]*--cm-control-height-lg/);
  assert.doesNotMatch(controlCss, /\d+(?:\.\d+)?(?:px|rem)/);
});

test('keeps native and aria disabled control states visually aligned', () => {
  assert.match(controlCss, /\.cm-control:disabled,/);
  assert.match(controlCss, /\.cm-control\[aria-disabled='true'\]/);
  assert.match(controlCss, /color: var\(--cm-color-text-disabled\);/);
  assert.doesNotMatch(controlCss, /pointer-events:\s*none/);
  assert.doesNotMatch(controlCss, /--(?:vf|vueforge)-|\.vf-/);
});

test('ships token-backed surface elevation levels without layout ownership', () => {
  assert.match(surfaceCss, /\.cm-surface \{/);
  assert.match(surfaceCss, /\.cm-surface--subtle/);
  assert.match(surfaceCss, /\.cm-surface--elevated[\s\S]*var\(--cm-shadow-surface\)/);
  assert.match(surfaceCss, /\.cm-surface--overlay[\s\S]*var\(--cm-shadow-overlay\)/);
  assert.doesNotMatch(surfaceCss, /(?:padding|margin|inline-size|block-size):/);
  assert.doesNotMatch(surfaceCss, /\d+(?:\.\d+)?(?:px|rem)/);
  assert.doesNotMatch(surfaceCss, /--(?:vf|vueforge)-|\.vf-/);
});
