import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const readComponent = (slug) => readFile(new URL(`../src/components/${slug}.css`, import.meta.url), 'utf8');

test('preserves the reference Input size geometry and typography', async () => {
  const input = await readComponent('input');

  assert.match(input, /padding: 0\.3125rem var\(--cm-space-3\);/u);
  assert.match(input, /font-size: var\(--cm-font-size-xl\);/u);
  assert.match(input, /\.cm-input--sm[\s\S]*padding: var\(--cm-space-1\) var\(--cm-space-2\);/u);
  assert.match(input, /\.cm-input--sm[\s\S]*font-size: var\(--cm-font-size-md\);/u);
  assert.match(input, /\.cm-input--lg[\s\S]*padding: var\(--cm-space-2\) 0\.875rem;/u);
  assert.match(input, /\.cm-input--lg[\s\S]*font-size: var\(--cm-font-size-2xl\);/u);
});

test('preserves the reference Input state matrix and adornment geometry', async () => {
  const input = await readComponent('input');

  assert.match(input, /border: var\(--cm-border-width\) solid var\(--cm-color-border-interactive\);/u);
  assert.match(input, /\.cm-input:focus \{\s*border-color: var\(--cm-color-border-focus\);/u);
  assert.match(input, /\.cm-input__action:focus-visible \{[^}]*box-shadow:/u);
  assert.match(input, /\.cm-input:read-only:where\(:not\(:disabled\)\)::placeholder/u);
  assert.match(input, /\.cm-input-wrap:has\(\.cm-input__leading\) \.cm-input/u);
  assert.match(input, /padding-inline-start: 2\.125rem;/u);
  assert.match(input, /\.cm-input__action:has\(\+ \.cm-input__action:not\(\[hidden\]\)\)/u);
});

test('uses a single border for interactive fields in standard color modes', async () => {
  for (const name of ['input', 'textarea', 'select', 'date-picker']) {
    const css = await readComponent(name);
    const selector = `.cm-${name}`;
    const invalid = `${selector}--invalid, [aria-invalid='true']`;
    const rest = `${selector}:is(${invalid}):where(:not(:disabled)) {\n  border-color: var(--cm-color-status-danger-border);`;
    const hover = `${selector}:hover:where(`;
    const focus = `${selector}:focus {\n  border-color: var(--cm-color-border-focus);`;
    assert.ok(css.includes(rest), `${name} shows the error border at rest when enabled`);
    assert.ok(css.indexOf(hover) > css.indexOf(rest), `${name} gives hover priority over invalid`);
    assert.ok(css.indexOf(focus) > css.indexOf(hover), `${name} gives focus priority over hover`);
    for (const rule of css.matchAll(
      new RegExp(`\\.cm-${name}:focus(?:-visible)?(?=[ {:\\n,])[^{}]*\\{([^}]*)\\}`, 'gu'),
    )) {
      assert.doesNotMatch(rule[1], /box-shadow:/u);
    }
    assert.match(css, new RegExp(`\\.cm-${name}:focus-visible \\{[^}]*--cm-forced-focus-outline-color`, 'u'));
  }
});

test('preserves the reference Field and Fieldset text rhythm', async () => {
  const [field, fieldset] = await Promise.all([readComponent('field'), readComponent('fieldset')]);

  for (const css of [field, fieldset]) {
    assert.match(css, /box-sizing: border-box;/u);
    assert.match(css, /inline-size: 100%;/u);
    assert.match(css, /row-gap: var\(--cm-space-2\);/u);
    assert.match(css, /font-weight: var\(--cm-font-weight-medium\);/u);
  }
  assert.match(field, /\.cm-field__label[\s\S]*font-size: var\(--cm-font-size-xl\);/u);
  assert.match(field, /\.cm-field__control[\s\S]*display: grid;/u);
  assert.match(fieldset, /\.cm-fieldset__legend[\s\S]*font-size: var\(--cm-font-size-md\);/u);
  assert.match(field, /\.cm-field--invalid \.cm-field__label[\s\S]*color: var\(--cm-color-text-primary\);/u);
  assert.match(fieldset, /\.cm-fieldset--invalid \.cm-fieldset__legend[\s\S]*color: var\(--cm-color-text-primary\);/u);
});
