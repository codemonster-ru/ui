import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const resetCss = await readFile(new URL('../dist/foundation/reset.css', import.meta.url), 'utf8');
const documentCss = await readFile(
  new URL('../dist/foundation/document.css', import.meta.url),
  'utf8',
);

test('ships a small predictable document reset', () => {
  assert.match(resetCss, /box-sizing: border-box;/);
  assert.match(resetCss, /button,[\s\S]*font: inherit;/);
  assert.match(resetCss, /\[hidden\][\s\S]*display: none !important;/);
  assert.doesNotMatch(resetCss, /--(?:vf|vueforge)-|\.vf-/);
});

test('uses semantic tokens for document colors and typography', () => {
  assert.match(documentCss, /background: var\(--cm-color-background-canvas\);/);
  assert.match(documentCss, /color: var\(--cm-color-text-primary\);/);
  assert.match(documentCss, /font-family: var\(--cm-font-family-base\);/);
  assert.match(documentCss, /:root\[data-cm-theme='dark'\][\s\S]*color-scheme: dark;/);
  assert.doesNotMatch(documentCss, /--(?:vf|vueforge)-|\.vf-/);
});
