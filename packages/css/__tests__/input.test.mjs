import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const css = await readFile(new URL('../dist/components/input.css', import.meta.url), 'utf8');
const validation = await readFile(new URL('../dist/primitives/form-validation.css', import.meta.url), 'utf8');

test('styles canonical Input sizes and native states from shared tokens', () => {
  for (const modifier of ['sm', 'md', 'lg']) {
    assert.match(css, new RegExp(`\\.cm-input--${modifier}(?:[\\s,{])`));
  }
  assert.match(css, /\.cm-input:disabled/);
  assert.match(css, /\.cm-input:read-only/);
  assert.match(css, /@import '\.\.\/primitives\/form-validation\.css';/u);
  assert.match(validation, /\.cm-input:is\(\.cm-input--invalid, \[aria-invalid='true'\]\):enabled/u);
  assert.match(css, /\.cm-input-wrap/);
  assert.match(css, /\.cm-input__leading/);
  assert.match(css, /\.cm-input__trailing/);
  assert.match(css, /\.cm-input__action/);
  assert.doesNotMatch(css, /pointer-events:\s*none|--(?:vf|vueforge)-|\.vf-/);
});
