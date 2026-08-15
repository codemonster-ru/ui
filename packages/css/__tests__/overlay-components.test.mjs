import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

for (const slug of ['dialog', 'drawer', 'dropdown', 'popover', 'tooltip']) {
  test(`styles ${slug} only through shared tokens and cm selectors`, async () => {
    const css = await readFile(new URL(`../src/components/${slug}.css`, import.meta.url), 'utf8');

    assert.match(css, new RegExp(`\\.cm-${slug}`, 'u'));
    assert.match(css, /var\(--cm-/u);
    assert.doesNotMatch(css, /(?:--vf-|\.vf-|vue|react|angular)/iu);
  });
}

test('preserves modal, focus, hidden, and logical-placement hooks', async () => {
  const [dialog, drawer, popover, tooltip] = await Promise.all(
    ['dialog', 'drawer', 'popover', 'tooltip'].map((slug) =>
      readFile(new URL(`../src/components/${slug}.css`, import.meta.url), 'utf8'),
    ),
  );

  assert.match(dialog, /\.cm-dialog::backdrop/u);
  assert.match(dialog, /\.cm-dialog__close:focus-visible/u);
  assert.match(drawer, /\.cm-drawer--start/u);
  assert.match(drawer, /inset-inline/u);
  assert.match(popover, /\.cm-popover__panel\[hidden\]/u);
  assert.match(tooltip, /\.cm-tooltip__content\[hidden\]/u);
  assert.doesNotMatch(`${dialog}${drawer}${popover}${tooltip}`, /(?:left|right):/u);
});

test('preserves the fd793696 overlay geometry through CodeMonster tokens', async () => {
  const [dialog, drawer, dropdown, popover, tooltip] = await Promise.all(
    ['dialog', 'drawer', 'dropdown', 'popover', 'tooltip'].map((slug) =>
      readFile(new URL(`../src/components/${slug}.css`, import.meta.url), 'utf8'),
    ),
  );

  assert.match(dialog, /max-block-size: min\(85vh, calc\(var\(--cm-space-16\) \* 12\)\)/u);
  assert.match(dialog, /var\(--cm-color-border-strong\)/u);
  assert.doesNotMatch(dialog.match(/\.cm-dialog,[\s\S]*?\n\}/u)?.[0] ?? '', /box-shadow/u);
  assert.match(dialog, /\.cm-dialog--sm[\s\S]*var\(--cm-space-16\) \* 7/u);
  assert.match(dialog, /\.cm-dialog--lg[\s\S]*var\(--cm-space-16\) \* 12/u);
  assert.match(dialog, /outline: var\(--cm-focus-ring-width\) solid var\(--cm-color-focus-ring\);/u);
  assert.match(drawer, /var\(--cm-space-16\) \* 6 \+ var\(--cm-space-2\) \* 4/u);
  assert.doesNotMatch(drawer.match(/\.cm-drawer,[\s\S]*?\n\}/u)?.[0] ?? '', /box-shadow/u);
  assert.match(drawer, /\.cm-drawer--full[\s\S]*inline-size: 100dvw/u);
  assert.match(drawer, /outline: var\(--cm-focus-ring-width\) solid var\(--cm-color-focus-ring\);/u);
  assert.doesNotMatch(dropdown, /\.cm-dropdown__trigger::after/u);
  assert.match(dropdown, /\.cm-dropdown__trigger[\s\S]*padding: var\(--cm-button-padding-md\);/u);
  assert.match(dropdown, /font-size: var\(--cm-control-font-size-md\);/u);
  assert.match(dropdown, /min-inline-size: max\(100%, calc\(var\(--cm-space-16\) \* 3\)\)/u);
  assert.match(popover, /\.cm-popover__trigger[\s\S]*padding: var\(--cm-button-padding-md\);/u);
  assert.match(popover, /padding: var\(--cm-space-3\) var\(--cm-space-4\)/u);
  assert.match(popover, /border-radius: var\(--cm-radius-surface\)/u);
  assert.match(tooltip, /padding-block: var\(--cm-space-2\)/u);
  assert.match(tooltip, /padding-inline: var\(--cm-space-3\)/u);
  assert.match(tooltip, /border: var\(--cm-border-width\) solid var\(--cm-color-border-inverse\)/u);
  assert.match(tooltip, /outline: var\(--cm-focus-ring-width\) solid var\(--cm-color-focus-ring\);/u);
  assert.match(`${dialog}${drawer}${popover}${tooltip}`, /font-size: var\(--cm-font-size-xl\)/u);
});
