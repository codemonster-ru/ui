import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const readComponent = (slug) => readFile(new URL(`../src/components/${slug}.css`, import.meta.url), 'utf8');

test('preserves reference Select and DatePicker control geometry', async () => {
  const controls = await Promise.all(['select', 'date-picker'].map(readComponent));

  for (const css of controls) {
    assert.match(css, /box-sizing: border-box;/u);
    assert.match(css, /padding: 0\.3125rem var\(--cm-space-3\);/u);
    assert.match(css, /font-size: var\(--cm-font-size-xl\);/u);
    assert.match(css, /padding: var\(--cm-space-1\) var\(--cm-space-2\);/u);
    assert.match(css, /font-size: var\(--cm-font-size-md\);/u);
    assert.match(css, /padding: var\(--cm-space-2\) 0\.875rem;/u);
    assert.match(css, /font-size: var\(--cm-font-size-2xl\);/u);
  }
});

test('preserves reference native-control interaction states', async () => {
  const [select, datePicker] = await Promise.all(['select', 'date-picker'].map(readComponent));

  for (const [component, css] of [
    ['select', select],
    ['date-picker', datePicker],
  ]) {
    assert.match(css, /border: var\(--cm-border-width\) solid var\(--cm-color-border-interactive\);/u);
    assert.match(css, new RegExp(`\\.cm-${component}:focus,`, 'u'));
    assert.match(css, /border-color: var\(--cm-color-border-focus\);/u);
    assert.match(css, /box-shadow: 0 0 0 var\(--cm-border-width-thick\) var\(--cm-color-focus-ring\);/u);
    assert.match(css, /border-color: var\(--cm-color-status-danger-border\);/u);
    assert.match(css, /background: var\(--cm-color-background-surface-disabled\);/u);
  }
});

test('preserves reference clear-control positioning without changing canonical DOM', async () => {
  const [select, datePicker] = await Promise.all(['select', 'date-picker'].map(readComponent));

  for (const css of [select, datePicker]) {
    assert.match(css, /position: absolute;/u);
    assert.match(css, /inset-inline-end: 0\.625rem;/u);
    assert.match(css, /inline-size: 1\.375rem;/u);
    assert.match(css, /block-size: 1\.375rem;/u);
    assert.match(css, /border-radius: var\(--cm-radius-control-tight\);/u);
  }
  assert.match(select, /padding-inline-end: 2\.25rem;/u);
  assert.match(datePicker, /padding-inline-end: 3\.625rem;/u);
});
