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

test('keeps native modal motion and exit safety in each standalone stylesheet', async () => {
  const [dialog, drawer, palette] = await Promise.all(['dialog', 'drawer', 'command-palette'].map(readBuiltStyles));
  for (const css of [dialog, drawer, palette]) {
    assert.match(css, /@media \(prefers-reduced-motion: no-preference\)/u);
    assert.match(css, /@starting-style \{\s+:is\(\.cm-command-palette, \.cm-dialog, \.cm-drawer\):modal/u);
    assert.match(css, /transition-duration: var\(--cm-modal-duration\)/u);
    assert.match(css, /--cm-modal-duration: var\(--cm-motion-duration-fast\)/u);
    assert.match(css, /--cm-modal-duration: var\(--cm-motion-duration-normal\)/u);
    assert.match(css, /--cm-modal-shift: 0 var\(--cm-space-3\)/u);
    assert.match(
      css,
      /:has\(\s*\.cm-date-picker-wrap,\s*\.cm-dropdown,\s*\.cm-menu-bar,\s*\.cm-popover,\s*\.cm-select-wrap,\s*\.cm-tooltip\s*\) \{\s+--cm-modal-shift: none;/u,
    );
    const exit = css.slice(css.indexOf('@supports (overlay: auto) and (interactivity: inert)'));
    assert.match(exit, /^@supports \(overlay: auto\) and \(interactivity: inert\)/u);
    assert.match(
      exit,
      /transition-behavior: allow-discrete;\s+transition-property: opacity, translate, display, overlay;/u,
    );
    assert.match(exit, /:not\(\[open\]\) \{\s+interactivity: inert;/u);
    assert.match(exit, /:not\(\[open\]\)::backdrop \{\s+pointer-events: none;/u);
  }
  assert.match(palette, /--cm-modal-shift: 0 calc\(0px - var\(--cm-space-2\)\)/u);
  assert.match(drawer, /\.cm-drawer--start:dir\(ltr\), \.cm-drawer--end:dir\(rtl\)\) \{\s+--cm-drawer-enter: -100%/u);
});

test('makes reveal and safe exit motion available in each standalone anchored overlay stylesheet', async () => {
  for (const [slug, part] of [
    ['date-picker', 'calendar'],
    ['dropdown', 'menu'],
    ['menu-bar', 'submenu'],
    ['popover', 'panel'],
    ['select', 'listbox'],
    ['tooltip', 'content'],
  ]) {
    const css = await readBuiltStyles(slug);
    assert.match(css, /@media \(prefers-reduced-motion: no-preference\) \{\s+:is\(/u);
    assert.match(css, new RegExp(`:is\\([^)]*\\.cm-${slug}__${part}[^)]*\\) \\{[^{}]*@starting-style`, 'u'));
    assert.match(css, /@supports \(interactivity: inert\)[\s\S]*?transition-behavior: allow-discrete/u);
    assert.match(css, /transition-property: opacity, translate, scale, display/u);
    assert.match(css, /&\[hidden\] \{[^{}]*interactivity: inert/u);
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
