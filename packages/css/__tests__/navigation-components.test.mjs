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
