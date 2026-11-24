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
  assert.match(input, /\.cm-input__action:focus-visible \{[^}]*outline:/u);
  assert.match(input, /\.cm-input:read-only:where\(:not\(:disabled\)\)::placeholder/u);
  assert.match(input, /\.cm-input-wrap:has\(\.cm-input__leading\) \.cm-input/u);
  assert.match(input, /padding-inline-start: 2\.125rem;/u);
  assert.match(input, /\.cm-input__action:has\(\+ \.cm-input__action:not\(\[hidden\]\)\)/u);
});

test('shares an offset focus outline that follows form validation', async () => {
  const validation = await readFile(new URL('../src/primitives/form-validation.css', import.meta.url), 'utf8');
  for (const name of ['input', 'textarea', 'select', 'date-picker']) {
    const css = await readComponent(name);
    assert.match(css, /@import '\.\.\/primitives\/form-validation\.css';/u);
    assert.ok(validation.includes(`.cm-${name}:is(.cm-${name}--invalid, [aria-invalid='true']):enabled`));
  }
  assert.match(validation, /:is\(\.cm-input, \.cm-textarea, \.cm-select, \.cm-date-picker\):enabled:focus-visible/u);
  assert.match(
    validation,
    /--cm-form-focus-color: color-mix\(\s*in oklab,\s*var\(--cm-form-validation-color\),\s*var\(--cm-status-focus-tint, transparent 0%\)\s*\);/u,
  );
  assert.match(
    validation,
    /outline: var\(--cm-focus-ring-width\) solid\s+var\(--cm-forced-focus-outline-color, var\(--cm-form-focus-color, var\(--cm-color-focus-ring\)\)\);/u,
  );
  assert.match(validation, /outline-offset: var\(--cm-border-width-thick\);/u);
  assert.match(validation, /\[data-cm-valid='true'\]:enabled/u);
  assert.match(validation, /--cm-form-validation-color: var\(--cm-color-status-success-border\);/u);
  assert.match(validation, /--cm-form-validation-color: var\(--cm-color-status-danger-border\);/u);
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
