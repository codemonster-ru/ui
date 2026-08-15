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
  assert.match(css, /gap: var\(--cm-space-3\);/);
  assert.match(css, /padding: var\(--cm-space-4\);/);
  assert.match(css, /border: var\(--cm-border-width\) solid var\(--cm-color-border-default\);/);
  assert.match(css, /\.cm-card--compact\s*\{[^}]*gap: var\(--cm-space-2\);/s);
  assert.match(css, /\.cm-card--compact\s*\{[^}]*padding: var\(--cm-space-3\);/s);
});

test('preserves the frozen Card text rhythm', () => {
  assert.match(css, /\.cm-card\s*\{[^}]*line-height: var\(--cm-line-height-normal\);/s);
  assert.match(css, /\.cm-card__title\s*\{[^}]*font-size: var\(--cm-font-size-xl\);/s);
  assert.match(css, /\.cm-card__title\s*\{[^}]*font-weight: var\(--cm-font-weight-regular\);/s);
  assert.match(css, /\.cm-card__title\s*\{[^}]*line-height: var\(--cm-line-height-normal\);/s);
  assert.doesNotMatch(css, /\.cm-card__title\s*\{[^}]*font-family:/s);
});

test('styles every canonical Card region without VueForge ownership', () => {
  for (const region of ['header', 'title', 'body', 'footer']) {
    assert.match(css, new RegExp(`\\.cm-card__${region}(?:[\\s,{])`));
  }

  assert.doesNotMatch(css, /--(?:vf|vueforge)-|\.vf-/);
});
