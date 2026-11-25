import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';
import postcss from 'postcss';

async function readBuiltStyles(slug) {
  const entry = new URL(`../dist/components/${slug}.css`, import.meta.url);
  const css = await readFile(entry, 'utf8');
  const imports = [...css.matchAll(/@import '(\.\.\/primitives\/[^']+)';/gu)];
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
  postcss
    .parse(`${dialog}${drawer}${popover}${tooltip}`)
    .walkDecls(/^(?:(?:margin|padding|border)-)?(?:left|right)$/u, (declaration) => {
      assert.fail(`Expected a logical CSS property instead of ${declaration.prop}`);
    });
});

test('keeps anchored panels outside the scroll clip of native modals', async () => {
  for (const component of ['dialog', 'drawer']) {
    const css = await readBuiltStyles(component);
    assert.match(css, /\.cm-drawer__body\)\s*\{[^}]*overflow: auto;/u);
    assert.match(
      css,
      /:is\(\.cm-dialog, \.cm-drawer\):modal\s+:is\(\.cm-tooltip__content, \.cm-dropdown__menu, \.cm-popover__panel, \.cm-select__listbox, \.cm-date-picker__calendar\)\s*\{\s*position: fixed;/u,
    );
  }
});

test('keeps inline popups above floating labels and clear buttons', async () => {
  const [tooltip, select, datePicker, field, dropdown, popover, menuBar] = await Promise.all(
    ['tooltip', 'select', 'date-picker', 'field', 'dropdown', 'popover', 'menu-bar'].map(readBuiltStyles),
  );
  const layer = (css, part) => {
    let layerValue;
    postcss.parse(css).walkRules((rule) => {
      if (!rule.selector.endsWith(part)) return;
      const declaration = rule.nodes.find((node) => node.type === 'decl' && node.prop === 'z-index');
      assert.match(declaration?.value ?? '', /^\d+$/u, `Missing layer for ${part}`);
      layerValue = Number(declaration.value);
      return false;
    });
    assert.notEqual(layerValue, undefined, `Missing CSS rule for ${part}`);
    return layerValue;
  };
  const controls = [
    layer(field, '> .cm-field__label'),
    layer(select, '.cm-select__clear'),
    layer(datePicker, '.cm-date-picker__clear'),
  ];
  for (const [css, part] of [
    [tooltip, '.cm-tooltip__content'],
    [select, '.cm-select__listbox'],
    [datePicker, '.cm-date-picker__calendar'],
    [dropdown, '.cm-dropdown__menu.cm-menu'],
    [popover, '.cm-popover__panel'],
    [menuBar, '.cm-menu-bar__submenu'],
  ]) {
    assert(layer(css, part) > Math.max(...controls), `${part} should cover adjacent form chrome`);
  }
  assert(
    layer(tooltip, '.cm-tooltip:hover > .cm-tooltip__content:not([data-cm-tooltip-floating])') >
      layer(tooltip, '.cm-tooltip__content'),
  );
});

test('keeps native modal motion and exit safety in each standalone stylesheet', async () => {
  const [dialog, drawer, palette] = await Promise.all(['dialog', 'drawer', 'command-palette'].map(readBuiltStyles));
  for (const css of [dialog, drawer, palette]) {
    assert.match(css, /@media \(prefers-reduced-motion: no-preference\)/u);
    assert.match(css, /@starting-style\s*\{\s*:is\(\.cm-command-palette, \.cm-dialog, \.cm-drawer\):modal/u);
    assert.match(css, /transition-duration: var\(--cm-modal-duration\)/u);
    assert.match(css, /--cm-modal-duration: var\(--cm-motion-duration-fast\)/u);
    assert.match(css, /--cm-modal-duration: var\(--cm-motion-duration-normal\)/u);
    assert.match(css, /--cm-modal-shift: 0 var\(--cm-space-3\)/u);
    assert.match(
      css,
      /:has\(\s*\.cm-date-picker-wrap,\s*\.cm-dropdown,\s*\.cm-menu-bar,\s*\.cm-popover,\s*\.cm-select-wrap,\s*\.cm-tooltip\s*\)\s*\{\s*--cm-modal-shift: none;/u,
    );
    const exit = css.slice(css.indexOf('@supports (overlay: auto) and (interactivity: inert)'));
    assert.match(exit, /^@supports \(overlay: auto\) and \(interactivity: inert\)/u);
    assert.match(
      exit,
      /transition-behavior: allow-discrete;\s*transition-property: opacity, translate, display, overlay;/u,
    );
    assert.match(exit, /:not\(\[open\]\)\s*\{\s*interactivity: inert;/u);
    assert.match(exit, /:not\(\[open\]\)::backdrop\s*\{\s*pointer-events: none;/u);
  }
  assert.match(palette, /--cm-modal-shift: 0 calc\(0px - var\(--cm-space-2\)\)/u);
  assert.match(drawer, /\.cm-drawer--start:dir\(ltr\), \.cm-drawer--end:dir\(rtl\)\)\s*\{\s*--cm-drawer-enter: -100%/u);
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
    assert.match(css, /@media \(prefers-reduced-motion: no-preference\)\s*\{\s*:is\(/u);
    assert.match(css, new RegExp(`:is\\([^)]*\\.cm-${slug}__${part}[^)]*\\)\\s*\\{[^{}]*@starting-style`, 'u'));
    assert.match(css, /@supports \(interactivity: inert\)[\s\S]*?transition-behavior: allow-discrete/u);
    assert.match(css, /transition-property: opacity, translate, scale, display/u);
    assert.match(css, /&\[hidden\]\s*\{[^{}]*interactivity: inert/u);
  }
});

test('preserves the fd793696 overlay geometry through CodeMonster tokens', async () => {
  const [dialog, drawer, dropdown, popover, tooltip] = await Promise.all(
    ['dialog', 'drawer', 'dropdown', 'popover', 'tooltip'].map(readBuiltStyles),
  );
  const focusOutline =
    /outline: var\(--cm-focus-ring-width\) solid var\(--cm-forced-focus-outline-color, var\(--cm-color-focus-ring\)\);/u;
  const modalSurface = /(?:^|[;}])\s*:is\(\.cm-dialog, \.cm-drawer\)\s*\{[^}]*\}/mu;
  for (const css of [dialog, drawer]) {
    const surface = css.match(modalSurface)?.[0];
    assert.ok(surface);
    assert.doesNotMatch(surface, /box-shadow/u);
  }

  assert.match(dialog, /max-block-size: min\(85vh, calc\(var\(--cm-space-16\) \* 12\)\)/u);
  assert.match(dialog, /var\(--cm-color-border-strong\)/u);
  assert.match(dialog, /\.cm-dialog--sm[\s\S]*var\(--cm-space-16\) \* 7/u);
  assert.match(dialog, /\.cm-dialog--lg[\s\S]*var\(--cm-space-16\) \* 12/u);
  assert.match(dialog, focusOutline);
  assert.match(drawer, /var\(--cm-space-16\) \* 6 \+ var\(--cm-space-2\) \* 4/u);
  assert.match(drawer, /\.cm-drawer--full[\s\S]*inline-size: 100dvw/u);
  assert.match(drawer, focusOutline);
  assert.doesNotMatch(dropdown, /\.cm-dropdown__trigger::after/u);
  assert.match(dropdown, /\.cm-dropdown__trigger[\s\S]*padding: var\(--cm-button-padding-md\);/u);
  assert.match(dropdown, /font-size: var\(--cm-control-font-size-md\);/u);
  const dropdownMenu = dropdown.match(/\.cm-dropdown__menu\.cm-menu\s*\{[^}]*\}/u)?.[0] ?? '';
  assert.match(dropdownMenu, /--cm-dropdown-viewport-width: calc\(100dvw - 2 \* var\(--cm-space-4\)\);/u);
  assert.match(dropdownMenu, /inline-size: max-content;/u);
  assert.match(
    dropdownMenu,
    /min-inline-size: min\(var\(--cm-dropdown-viewport-width\), var\(--cm-dropdown-anchor-width, 100%\)\);/u,
  );
  assert.match(dropdownMenu, /max-inline-size: var\(--cm-dropdown-viewport-width\);/u);
  assert.match(
    dropdown,
    /\.cm-dropdown__menu\.cm-menu:has\(> \.cm-icon-button\):not\(:has\(> :not\(\.cm-icon-button\)\)\)\s*\{\s*min-inline-size: 0;/u,
  );
  assert.match(popover, /\.cm-popover__trigger[\s\S]*padding: var\(--cm-button-padding-md\);/u);
  assert.match(popover, /padding: var\(--cm-space-3\) var\(--cm-space-4\)/u);
  assert.match(popover, /border-radius: var\(--cm-radius-surface\)/u);
  assert.match(tooltip, /padding-block: var\(--cm-space-2\)/u);
  assert.match(tooltip, /padding-inline: var\(--cm-space-3\)/u);
  assert.match(tooltip, /border: var\(--cm-border-width\) solid var\(--cm-color-border-inverse\)/u);
  assert.match(tooltip, focusOutline);
  assert.match(`${dialog}${drawer}${popover}${tooltip}`, /font-size: var\(--cm-font-size-xl\)/u);
});
