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
    assert.match(
      css,
      new RegExp(`\\.cm-${component}:focus \\{\\s*border-color: var\\(--cm-color-border-focus\\);`, 'u'),
    );
    assert.match(css, /border-color: var\(--cm-color-border-focus\);/u);
    assert.match(css, new RegExp(`\\.cm-${component}__clear:focus-visible \\{[^}]*box-shadow:`, 'u'));
    assert.match(css, /border-color: var\(--cm-color-status-danger-border\);/u);
    assert.match(css, /background: var\(--cm-color-background-surface-disabled\);/u);
  }
});

test('positions clear actions and reserves trigger space only when the action is shown', async () => {
  const [select, datePicker] = await Promise.all(['select', 'date-picker'].map(readComponent));

  for (const [name, css] of [
    ['select', select],
    ['date-picker', datePicker],
  ]) {
    const action = css.split(`.cm-${name}__clear {`)[1].split('}')[0];
    assert.match(action, /position: absolute;/u);
    assert.ok(action.includes(`inset-inline-end: var(--cm-${name}-action-inset);`));
    assert.match(action, /inline-size: var\(--cm-icon-size-xl\);/u);
    assert.match(action, /block-size: var\(--cm-icon-size-xl\);/u);
    assert.match(action, /border-radius: var\(--cm-radius-control-tight\);/u);
    const trigger = css
      .split(`.cm-${name}-wrap:has(> .cm-${name}__clear:not([hidden])) > .cm-${name} {`)[1]
      .split('}')[0];
    assert.ok(
      trigger.includes(
        `padding-inline-end: calc(var(--cm-${name}-action-inset) + var(--cm-icon-size-xl) + var(--cm-space-1));`,
      ),
    );
  }
});
