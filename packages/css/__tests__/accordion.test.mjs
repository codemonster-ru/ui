import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const css = await readFile(new URL('../dist/components/accordion.css', import.meta.url), 'utf8');

test('styles every canonical Accordion region and native state', () => {
  for (const region of ['item', 'heading', 'trigger', 'panel']) {
    assert.match(css, new RegExp(`\\.cm-accordion__${region}(?:[\\s,{])`));
  }
  assert.match(css, /\.cm-accordion__trigger\[aria-expanded='true'\]/);
  assert.match(css, /\.cm-accordion__trigger:disabled/);
  assert.match(css, /\.cm-accordion__panel\[hidden\]/);
  assert.match(css, /\.cm-accordion__trigger:focus-visible/);
  assert.doesNotMatch(css, /pointer-events:\s*none|--(?:vf|vueforge)-|\.vf-/);
});
