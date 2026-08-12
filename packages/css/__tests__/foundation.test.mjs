import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const resetCss = await readFile(new URL('../dist/foundation/reset.css', import.meta.url), 'utf8');
const documentCss = await readFile(
  new URL('../dist/foundation/document.css', import.meta.url),
  'utf8',
);
const focusCss = await readFile(new URL('../dist/foundation/focus.css', import.meta.url), 'utf8');
const preferencesCss = await readFile(
  new URL('../dist/foundation/preferences.css', import.meta.url),
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

test('shows token-backed focus rings only for focus-visible', () => {
  assert.match(focusCss, /\.cm-focus-ring:focus-visible/);
  assert.match(
    focusCss,
    /outline: var\(--cm-border-width-thick\) solid var\(--cm-color-focus-ring\);/,
  );
  assert.match(focusCss, /:focus:not\([\s\S]*:focus-visible/);
  assert.doesNotMatch(focusCss, /(^|,)\s*:focus\s*\{[^}]*outline:\s*none/m);
  assert.doesNotMatch(focusCss, /--(?:vf|vueforge)-|\.vf-/);
});

test('respects reduced motion and forced color preferences', () => {
  assert.match(preferencesCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(preferencesCss, /transition-duration: var\(--cm-motion-duration-none\) !important;/);
  assert.match(preferencesCss, /@media \(forced-colors: active\)/);
  assert.match(preferencesCss, /outline-color: Highlight;/);
  assert.match(preferencesCss, /color: GrayText;/);
  assert.doesNotMatch(preferencesCss, /--(?:vf|vueforge)-|\.vf-/);
});
