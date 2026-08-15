import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const css = await readFile(new URL('../dist/components/button.css', import.meta.url), 'utf8');

test('styles every Button variant and size from shared tokens', () => {
  for (const modifier of ['primary', 'secondary', 'danger', 'ghost', 'sm', 'lg']) {
    assert.match(css, new RegExp(`\\.cm-button--${modifier}(?:[\\s:{])`));
  }

  assert.match(css, /--cm-control-height-sm/);
  assert.match(css, /--cm-control-height-lg/);
  assert.match(css, /--cm-color-interactive-primary-background/);
  assert.match(css, /--cm-color-status-danger-solid-background/);
});

test('styles canonical Button state and content hooks', () => {
  assert.match(css, /\.cm-button:disabled/);
  assert.match(css, /\.cm-button\[aria-disabled='true'\]/);
  assert.match(css, /\.cm-button__leading/);
  assert.match(css, /\.cm-button__trailing/);
  assert.match(css, /\.cm-button__spinner/);
  assert.match(css, /--cm-button-spinner-duration: 1\.4s;/);
  assert.match(css, /animation: cm-button-spin var\(--cm-button-spinner-duration\)/);
  assert.match(css, /@keyframes cm-button-spin/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(css, /--(?:vf|vueforge)-|\.vf-/);
});

test('preserves the reference Button geometry and shared variant states', () => {
  assert.match(css, /gap: var\(--cm-button-gap\);/);
  assert.match(css, /padding: var\(--cm-button-padding-md\);/);
  assert.match(css, /font-size: var\(--cm-control-font-size-md\);/);
  assert.match(css, /font-weight: var\(--cm-font-weight-regular\);/);
  assert.match(css, /line-height: var\(--cm-control-line-height\);/);
  assert.match(css, /border-color: var\(--cm-color-border-focus\);/);
  assert.match(css, /box-shadow: 0 0 0 var\(--cm-focus-ring-width\) var\(--cm-color-focus-ring\);/);
  assert.match(css, /\.cm-button--secondary:active[\s\S]*border-color: var\(--cm-color-border-strong\);/);
  assert.match(css, /\.cm-button--ghost[\s\S]*color: var\(--cm-color-text-primary\);/);
});
