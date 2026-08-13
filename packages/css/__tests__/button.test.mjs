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
  assert.match(css, /@keyframes cm-button-spin/);
  assert.doesNotMatch(css, /--(?:vf|vueforge)-|\.vf-/);
});
