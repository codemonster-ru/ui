import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const css = await readFile(new URL('../dist/components/input.css', import.meta.url), 'utf8');

test('styles canonical Input sizes and native states from shared tokens', () => {
  for (const modifier of ['sm', 'md', 'lg', 'invalid']) {
    assert.match(css, new RegExp(`\\.cm-input--${modifier}(?:[\\s,{])`));
  }
  assert.match(css, /\.cm-input:disabled/);
  assert.match(css, /\.cm-input:read-only/);
  assert.match(css, /\.cm-input:focus-visible/);
  assert.match(css, /\.cm-input\[aria-invalid='true'\]/);
  assert.doesNotMatch(css, /pointer-events:\s*none|--(?:vf|vueforge)-|\.vf-/);
});
