import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

for (const slug of ['checkbox', 'radio', 'switch', 'textarea']) {
  test(`styles ${slug} only through shared tokens and cm selectors`, async () => {
    const css = await readFile(new URL(`../src/components/${slug}.css`, import.meta.url), 'utf8');

    assert.match(css, new RegExp(`\\.cm-${slug}`, 'u'));
    assert.match(css, /var\(--cm-/u);
    assert.match(css, /focus-visible/u);
    assert.doesNotMatch(css, /(?:--vf-|\.vf-|vue|react|angular)/iu);
  });
}

for (const slug of ['checkbox', 'radio', 'switch']) {
  test(`keeps the native ${slug} input focusable`, async () => {
    const css = await readFile(new URL(`../src/components/${slug}.css`, import.meta.url), 'utf8');
    const inputRule = css.match(new RegExp(`\\.cm-${slug}__input\\s*\\{(?<declarations>[^}]*)\\}`, 'u'))?.groups
      ?.declarations;

    assert.ok(inputRule);
    assert.match(inputRule, /opacity: 0;/u);
    assert.doesNotMatch(inputRule, /display: none;/u);
  });
}

test('preserves frozen selection-control geometry and typography', async () => {
  const [checkbox, radio] = await Promise.all(
    ['checkbox', 'radio'].map((slug) => readFile(new URL(`../src/components/${slug}.css`, import.meta.url), 'utf8')),
  );

  for (const css of [checkbox, radio]) {
    assert.match(css, /align-items: flex-start;/u);
    assert.match(css, /gap: var\(--cm-space-3\);/u);
    assert.match(css, /font-size: var\(--cm-control-font-size-md\);/u);
    assert.match(css, /box-shadow: 0 0 0 var\(--cm-focus-ring-width\) var\(--cm-color-focus-ring\);/u);
    assert.match(css, /border-color: var\(--cm-color-interactive-primary-border\);/u);
  }

  assert.match(checkbox, /--cm-checkbox-control-size: 1\.25rem;/u);
  assert.match(checkbox, /--cm-checkbox-control-offset: 0\.125rem;/u);
  assert.match(checkbox, /border-radius: calc\(var\(--cm-radius-control-tight\) - 0\.0625rem\);/u);
  assert.match(checkbox, /\.cm-checkbox__input:disabled:indeterminate \+ \.cm-checkbox__control \.cm-checkbox__mark/u);
  assert.doesNotMatch(
    checkbox,
    /\.cm-checkbox__input:disabled \+ \.cm-checkbox__control \.cm-checkbox__mark \{[^}]*background:/su,
  );
  assert.match(radio, /--cm-radio-dot-size: 0\.5rem;/u);
  assert.match(radio, /\.cm-radio__input:checked \+ \.cm-radio__control \{\s*border-color:[^}]+\}/u);
  assert.doesNotMatch(
    radio,
    /\.cm-radio__input:checked \+ \.cm-radio__control \{[^}]*background: var\(--cm-color-interactive-primary-background\)/su,
  );
});

test('preserves frozen switch and textarea dimensions', async () => {
  const [switchCss, textarea] = await Promise.all(
    ['switch', 'textarea'].map((slug) => readFile(new URL(`../src/components/${slug}.css`, import.meta.url), 'utf8')),
  );

  assert.match(switchCss, /--cm-switch-track-inline-size: 2\.375rem;/u);
  assert.match(switchCss, /--cm-switch-track-block-size: 1\.375rem;/u);
  assert.match(switchCss, /--cm-switch-thumb-size: 1rem;/u);
  assert.match(switchCss, /\.cm-switch:dir\(rtl\)/u);
  assert.match(switchCss, /border-color: var\(--cm-color-interactive-primary-border\);/u);
  assert.match(textarea, /min-block-size: 6rem;/u);
  assert.match(textarea, /\.cm-textarea--sm[\s\S]*min-block-size: 4\.5rem;/u);
  assert.match(textarea, /\.cm-textarea--lg[\s\S]*min-block-size: 7rem;/u);
  assert.match(textarea, /padding: var\(--cm-field-padding-md\);/u);
  assert.match(textarea, /border-color: var\(--cm-color-interactive-primary-border\);/u);
});
