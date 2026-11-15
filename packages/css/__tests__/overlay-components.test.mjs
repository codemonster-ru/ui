import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

async function readBuiltStyles(slug) {
  const entry = new URL(`../dist/components/${slug}.css`, import.meta.url);
  const css = await readFile(entry, 'utf8');
  const imports = [...css.matchAll(/^@import '(\.\.\/primitives\/[^']+)';/gmu)];
  const primitives = await Promise.all(imports.map(([, file]) => readFile(new URL(file, entry), 'utf8')));
  return [...primitives, css].join('\n');
}

for (const slug of ['dialog', 'drawer', 'dropdown', 'popover', 'tooltip']) {
  test(`styles ${slug} only through shared tokens and cm selectors`, async () => {
    const css = await readFile(new URL(`../src/components/${slug}.css`, import.meta.url), 'utf8');

    assert.match(css, new RegExp(`\\.cm-${slug}`, 'u'));
    assert.match(css, /var\(--cm-/u);
    assert.doesNotMatch(css, /(?:--vf-|\.vf-|vue|react|angular)/iu);
  });
}

test('preserves modal, focus, hidden, and logical-placement hooks', async () => {
  const [dialog, drawer, popover, tooltip] = await Promise.all([
    readBuiltStyles('dialog'),
    readBuiltStyles('drawer'),
    readFile(new URL('../src/components/popover.css', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/tooltip.css', import.meta.url), 'utf8'),
  ]);

  assert.match(dialog, /:is\(\.cm-dialog, \.cm-drawer\)::backdrop/u);
  assert.match(dialog, /:is\(\.cm-dialog__close, \.cm-drawer__close\):focus-visible/u);
  assert.match(drawer, /\.cm-drawer--start/u);
  assert.match(drawer, /inset-inline/u);
  assert.match(popover, /\.cm-popover__panel\[hidden\]/u);
  assert.match(tooltip, /\.cm-tooltip__content\[hidden\]/u);
  assert.doesNotMatch(`${dialog}${drawer}${popover}${tooltip}`, /^\s*(?:(?:margin|padding|border)-)?(?:left|right):/mu);
});

test('starts native modal reveal motion from each standalone stylesheet', async () => {
  const [dialog, drawer] = await Promise.all(['dialog', 'drawer'].map(readBuiltStyles));
  assert.match(dialog, /@media \(prefers-reduced-motion: no-preference\) \{\s+\.cm-dialog:modal/u);
  assert.match(dialog, /cm-dialog-enter var\(--cm-motion-duration-fast\)/u);
  assert.match(dialog, /translate: 0 var\(--cm-space-3\)/u);
  assert.match(drawer, /\.cm-drawer:modal \{\s+animation: cm-drawer-enter var\(--cm-motion-duration-normal\)/u);
  assert.match(drawer, /\.cm-drawer:modal::backdrop \{\s+animation-duration: var\(--cm-motion-duration-normal\)/u);
  assert.match(drawer, /\.cm-drawer--start:dir\(ltr\), \.cm-drawer--end:dir\(rtl\)\) \{\s+--cm-drawer-enter: -100%/u);
  for (const css of [dialog, drawer]) {
    assert.match(
      css,
      /:modal:has\(\.cm-dropdown, \.cm-menu-bar, \.cm-popover, \.cm-tooltip\) \{\s+animation-name: cm-backdrop-enter;/u,
    );
    assert.match(css, /@keyframes cm-backdrop-enter \{\s+from \{\s+opacity: 0;\s+\}\s+\}/u);
  }
});

test('makes reveal motion available in each standalone anchored overlay stylesheet', async () => {
  for (const [slug, part] of [
    ['dropdown', 'menu'],
    ['menu-bar', 'submenu'],
    ['popover', 'panel'],
    ['tooltip', 'content'],
  ]) {
    const css = await readBuiltStyles(slug);
    assert.match(css, /@media \(prefers-reduced-motion: no-preference\) \{\s+:is\(/u);
    assert.match(
      css,
      new RegExp(`@starting-style\\s*\\{\\s*:is\\([^)]*\\.cm-${slug}__${part}[^)]*\\):not\\(\\[hidden\\]\\)`, 'u'),
    );
    assert.match(css, /transition-property: opacity, translate, scale/u);
  }
});

test('preserves the fd793696 overlay geometry through CodeMonster tokens', async () => {
  const [dialog, drawer, dropdown, popover, tooltip] = await Promise.all(
    ['dialog', 'drawer', 'dropdown', 'popover', 'tooltip'].map(readBuiltStyles),
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
