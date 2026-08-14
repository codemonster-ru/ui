import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const css = await readFile(new URL('../dist/components/icon-button.css', import.meta.url), 'utf8');

test('styles every IconButton variant and square size from shared tokens', () => {
  for (const modifier of ['primary', 'secondary', 'danger', 'ghost', 'sm', 'md', 'lg']) {
    assert.match(css, new RegExp(`\\.cm-icon-button--${modifier}(?:[\\s:{])`));
  }

  assert.match(css, /inline-size: var\(--cm-control-height-sm\)/);
  assert.match(css, /block-size: var\(--cm-control-height-lg\)/);
  assert.match(css, /--cm-color-interactive-primary-background/);
  assert.match(css, /--cm-color-status-danger-solid-background/);
});

test('styles the decorative icon hook and native button states', () => {
  assert.match(css, /\.cm-icon-button:disabled/);
  assert.match(css, /\.cm-icon-button:focus-visible/);
  assert.match(css, /\.cm-icon-button__icon/);
  assert.match(css, /pointer-events: none/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(css, /--(?:vf|vueforge)-|\.vf-/);
});
