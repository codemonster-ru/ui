import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const css = await readFile(new URL('../dist/components/button.css', import.meta.url), 'utf8');

test('styles every Button variant and size from shared tokens', () => {
  for (const modifier of [
    'primary',
    'secondary',
    'success',
    'info',
    'warn',
    'help',
    'danger',
    'contrast',
    'ghost',
    'block',
    'sm',
    'lg',
  ]) {
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
  assert.match(css, /\.cm-button__spinner-svg/);
  assert.match(css, /stroke: color-mix\(in srgb, currentcolor 30%, transparent\);/);
  assert.match(css, /\.cm-button__spinner-value[\s\S]*stroke-linecap: round;/);
  assert.match(css, /stroke-dasharray: 88 200;/);
  assert.match(css, /animation: cm-button-spinner-rotate var\(--cm-button-spinner-duration\)/);
  assert.match(css, /@keyframes cm-button-spinner-rotate/);
  assert.match(css, /@keyframes cm-button-spinner-dash/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(css, /--(?:vf|vueforge)-|\.vf-/);
});

test('preserves the reference Button geometry and shared variant states', () => {
  assert.match(css, /gap: var\(--cm-button-gap\);/);
  assert.match(css, /padding: var\(--cm-button-padding-md\);/);
  assert.match(css, /font-size: var\(--cm-control-font-size-md\);/);
  assert.match(css, /font-weight: var\(--cm-font-weight-regular\);/);
  assert.match(css, /line-height: var\(--cm-control-line-height\);/);
  assert.match(
    css,
    /\.cm-button:focus-visible\s*\{[^}]*outline: var\(--cm-focus-ring-width\) solid var\(--cm-button-focus-color, var\(--cm-color-focus-ring\)\);\s*outline-offset: var\(--cm-border-width-thick\);/u,
  );
  assert.match(css, /\.cm-button--danger\s*\{[^}]*--cm-button-status-color: var\(--cm-color-status-danger-border\);/u);
  assert.match(css, /\.cm-button--secondary:active[\s\S]*border-color: var\(--cm-color-border-strong\);/);
  assert.match(css, /\.cm-button--ghost[\s\S]*color: var\(--cm-color-text-primary\);/);
});
