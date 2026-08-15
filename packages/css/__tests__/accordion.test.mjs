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

test('preserves the frozen Accordion surface and trigger geometry', () => {
  assert.match(css, /\.cm-accordion\s*\{[^}]*border: var\(--cm-border-width\) solid var\(--cm-color-border-default\);/s);
  assert.match(css, /\.cm-accordion\s*\{[^}]*color: var\(--cm-color-text-secondary\);/s);
  assert.match(css, /\.cm-accordion__trigger\s*\{[^}]*min-block-size: var\(--cm-control-height-md\);/s);
  assert.match(css, /\.cm-accordion__trigger\s*\{[^}]*gap: var\(--cm-space-4\);/s);
  assert.match(css, /\.cm-accordion__trigger\s*\{[^}]*padding: var\(--cm-field-padding-md\);/s);
  assert.match(css, /\.cm-accordion__trigger\s*\{[^}]*font-size: var\(--cm-control-font-size-md\);/s);
  assert.match(css, /\.cm-accordion__trigger\s*\{[^}]*font-weight: var\(--cm-font-weight-medium\);/s);
  assert.match(css, /\.cm-accordion__trigger\s*\{[^}]*line-height: var\(--cm-line-height-normal\);/s);
  assert.match(css, /\.cm-accordion__item:first-child \.cm-accordion__trigger[^}]*border-start-start-radius: var\(--cm-radius-surface\);/s);
  assert.match(css, /\.cm-accordion__item:last-child \.cm-accordion__trigger[^}]*border-end-end-radius: var\(--cm-radius-surface\);/s);
});

test('maps frozen expanded, focus, icon, and panel visuals onto canonical regions', () => {
  assert.match(css, /\.cm-accordion__trigger\[aria-expanded='true'\][^}]*color: var\(--cm-color-selected-foreground\);/s);
  assert.match(css, /\.cm-accordion__trigger:focus-visible[^}]*box-shadow: 0 0 0 var\(--cm-focus-ring-width\)/s);
  assert.match(css, /\.cm-accordion__trigger::after[^}]*mask: url\("data:image\/svg\+xml,/s);
  assert.match(css, /\.cm-accordion__trigger\[aria-expanded='true'\]::after[^}]*rotate\(180deg\)/s);
  assert.match(css, /\.cm-accordion__panel\s*\{[^}]*padding: var\(--cm-space-3\) var\(--cm-space-4\);/s);
  assert.match(css, /\.cm-accordion__panel\s*\{[^}]*border-block-start: var\(--cm-border-width\) solid var\(--cm-color-border-divider\);/s);
  assert.match(css, /\.cm-accordion__panel\s*\{[^}]*font-size: var\(--cm-font-size-xl\);/s);
  assert.match(css, /\.cm-accordion__item:last-child \.cm-accordion__panel[^}]*border-end-end-radius: var\(--cm-radius-surface\);/s);
});
