import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const css = await readFile(new URL('../dist/components/fieldset.css', import.meta.url), 'utf8');

test('styles every canonical Fieldset region and invalid state from shared tokens', () => {
  for (const selector of [
    'cm-fieldset',
    'cm-fieldset__legend',
    'cm-fieldset__content',
    'cm-fieldset__description',
    'cm-fieldset__error',
  ]) {
    assert.match(css, new RegExp(`\\.${selector}(?:[\\s,{])`));
  }

  assert.match(css, /\.cm-fieldset--invalid \.cm-fieldset__legend/);
  assert.match(css, /--cm-color-status-danger-subtle-foreground/);
  assert.doesNotMatch(css, /--(?:vf|vueforge)-|\.vf-/);
});
