import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const css = await readFile(new URL('../dist/components/field.css', import.meta.url), 'utf8');

test('styles every canonical Field region and state from shared tokens', () => {
  for (const selector of [
    'cm-field',
    'cm-field__label',
    'cm-field__required',
    'cm-field__control',
    'cm-field__description',
    'cm-field__error',
  ]) {
    assert.match(css, new RegExp(`\\.${selector}(?:[\\s,{])`));
  }
  assert.match(css, /--cm-color-status-danger-subtle-foreground/);
  assert.doesNotMatch(css, /--(?:vf|vueforge)-|\.vf-/);
});
