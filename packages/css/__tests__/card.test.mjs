import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const css = await readFile(new URL('../dist/components/card.css', import.meta.url), 'utf8');

test('styles the canonical Card surface and compact state', () => {
  assert.match(css, /\.cm-card\s*\{/);
  assert.match(css, /\.cm-card--compact\s*\{/);
  assert.match(css, /var\(--cm-radius-surface\)/);
  assert.match(css, /var\(--cm-color-background-surface\)/);
  assert.match(css, /var\(--cm-space-5\)/);
  assert.match(css, /var\(--cm-space-3\)/);
});

test('styles every canonical Card region without VueForge ownership', () => {
  for (const region of ['header', 'title', 'body', 'footer']) {
    assert.match(css, new RegExp(`\\.cm-card__${region}(?:[\\s,{])`));
  }

  assert.doesNotMatch(css, /--(?:vf|vueforge)-|\.vf-/);
});
