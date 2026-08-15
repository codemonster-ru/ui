import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

for (const slug of ['breadcrumbs', 'dropdown', 'link', 'menu', 'tabs']) {
  test(`styles ${slug} only through shared tokens and cm selectors`, async () => {
    const css = await readFile(new URL(`../src/components/${slug}.css`, import.meta.url), 'utf8');

    assert.match(css, new RegExp(`\\.cm-${slug}`, 'u'));
    assert.match(css, /var\(--cm-/u);
    assert.doesNotMatch(css, /(?:--vf-|\.vf-|vue|react|angular)/iu);
  });
}

test('preserves navigation focus and hidden-state hooks', async () => {
  const [tabs, menu, dropdown] = await Promise.all(
    ['tabs', 'menu', 'dropdown'].map((slug) =>
      readFile(new URL(`../src/components/${slug}.css`, import.meta.url), 'utf8'),
    ),
  );

  assert.match(tabs, /\.cm-tabs__tab:focus-visible/u);
  assert.match(tabs, /\.cm-tabs__panel\[hidden\]/u);
  assert.match(menu, /\.cm-menu__item:focus-visible/u);
  assert.match(dropdown, /\.cm-dropdown__menu\[hidden\]/u);
  assert.doesNotMatch(`${tabs}${menu}${dropdown}`, /pointer-events:\s*none/u);
});

test('preserves the reference Breadcrumbs and Link geometry', async () => {
  const [breadcrumbs, link] = await Promise.all(
    ['breadcrumbs', 'link'].map((slug) =>
      readFile(new URL(`../src/components/${slug}.css`, import.meta.url), 'utf8'),
    ),
  );

  assert.match(breadcrumbs, /gap: calc\(var\(--cm-space-2\) \* 0\.75\);/u);
  assert.match(breadcrumbs, /font-size: var\(--cm-font-size-xl\);/u);
  assert.match(breadcrumbs, /inline-size: var\(--cm-icon-size-sm\);/u);
  assert.match(link, /display: inline-flex;/u);
  assert.match(link, /border: var\(--cm-border-width\) solid transparent;/u);
  assert.match(link, /text-decoration-thickness: 1px;/u);
  assert.match(link, /text-underline-offset: 0\.2em;/u);
  assert.match(link, /box-shadow: 0 0 0 var\(--cm-border-width-thick\) var\(--cm-color-focus-ring\);/u);
});

test('preserves the reference Tabs geometry on the canonical DOM', async () => {
  const tabs = await readFile(new URL('../src/components/tabs.css', import.meta.url), 'utf8');

  assert.match(tabs, /gap: calc\(var\(--cm-space-4\) - var\(--cm-space-1\)\);/u);
  assert.match(tabs, /min-block-size: var\(--cm-control-height-md\);/u);
  assert.match(tabs, /padding: 0\.3125rem var\(--cm-space-4\);/u);
  assert.match(tabs, /\.cm-tabs__tab::after[\s\S]*block-size: 3px;/u);
  assert.match(tabs, /\.cm-tabs__tab\[aria-selected='true'\]::after/u);
  assert.match(tabs, /padding: var\(--cm-space-4\) 0 0;/u);
});

test('preserves the reference Menu surface and item geometry', async () => {
  const menu = await readFile(new URL('../src/components/menu.css', import.meta.url), 'utf8');

  assert.match(menu, /min-inline-size: 12rem;/u);
  assert.match(menu, /padding: var\(--cm-space-2\);/u);
  assert.match(menu, /border-radius: var\(--cm-radius-control\);/u);
  assert.match(menu, /min-block-size: var\(--cm-control-height-sm\);/u);
  assert.match(menu, /padding: var\(--cm-space-1\) var\(--cm-space-2\);/u);
  assert.match(menu, /\.cm-menu__item-icon/u);
  assert.match(menu, /\.cm-menu__item--active,[\s\S]*background: transparent;/u);
});
