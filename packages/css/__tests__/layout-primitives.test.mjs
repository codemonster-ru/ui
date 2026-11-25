import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';
import postcss from 'postcss';

const slugs = ['container', 'grid', 'inline', 'section', 'stack'];

for (const slug of slugs) {
  test(`styles ${slug} only through shared tokens and cm selectors`, async () => {
    const css = await readFile(new URL(`../src/components/${slug}.css`, import.meta.url), 'utf8');
    assert.match(css, new RegExp(`\\.cm-${slug}`, 'u'));
    assert.match(css, /var\(--cm-/u);
    assert.doesNotMatch(css, /(?:--vf-|\.vf-|vue|react|angular)/iu);
  });
}

test('keeps layout primitives logical and responsive without runtime queries', async () => {
  const [container, grid, inline, section, stack] = await Promise.all(
    slugs.map((slug) => readFile(new URL(`../src/components/${slug}.css`, import.meta.url), 'utf8')),
  );
  assert.match(container, /max-inline-size: var\(--cm-breakpoint-2xl\)/u);
  assert.match(container, /margin-inline: auto/u);
  assert.match(grid, /repeat\(\s*auto-fit/u);
  assert.match(inline, /flex-wrap: nowrap/u);
  assert.match(section, /@media \(forced-colors: active\)/u);
  assert.match(stack, /flex-direction: column/u);
  assert.doesNotMatch(`${container}${grid}${inline}${section}${stack}`, /@media \([^)]*(?:min|max)-width/u);
});

test('preserves the fd793696 layout geometry through CodeMonster tokens', async () => {
  const [container, grid, inline, section, stack] = await Promise.all(
    slugs.map((slug) => readFile(new URL(`../src/components/${slug}.css`, import.meta.url), 'utf8')),
  );

  assert.match(container, /inline-size: 100%/u);
  assert.match(container, /\.cm-container \{[^}]*max-inline-size: var\(--cm-container-max-width, 80rem\)/u);
  assert.match(container, /\.cm-container--xl \{[^}]*max-inline-size: var\(--cm-breakpoint-xl\)/u);
  assert.match(container, /padding-inline: var\(--cm-container-padding, var\(--cm-space-4\)\)/u);
  assert.match(grid, /minmax\(min\(100%, var\(--cm-grid-min-item-width, calc\(var\(--cm-space-16\) \* 4\)\)\), 1fr\)/u);
  assert.match(section, /padding: var\(--cm-section-padding, var\(--cm-space-4\)\)/u);
  assert.match(section, /border: var\(--cm-border-width\) solid var\(--cm-color-border-default\)/u);
  assert.match(section, /border-radius: var\(--cm-section-radius, var\(--cm-radius-surface\)\)/u);
  assert.match(section, /box-shadow: var\(--cm-section-shadow, var\(--cm-shadow-none\)\)/u);
  assert.doesNotMatch(section, /color: var\(--cm-color-text-primary\)/u);
  for (const css of [grid, inline, stack]) assert.match(css, /gap: var\(--cm-layout-gap, var\(--cm-space-4\)\)/u);
});

test('places standalone areas in the named grid with the historical header and plain-divider geometry', async () => {
  const css = await readFile(new URL('../src/components/layout-areas.css', import.meta.url), 'utf8');
  const rules = postcss.parse(css).nodes;
  const declaration = (selector, property) =>
    rules.find((rule) => rule.selector === selector)?.nodes.find((node) => node.prop === property)?.value;

  for (const name of ['header', 'sidebar', 'content', 'aside', 'footer']) {
    assert.equal(declaration(`.cm-${name}-area`, 'grid-area'), name);
  }

  assert.equal(declaration('.cm-header-area', 'block-size'), 'var(--cm-layout-header-height)');
  assert.equal(declaration('.cm-header-area', 'position'), 'relative');
  assert.equal(declaration('.cm-header-area--sticky', 'position'), 'sticky');
  assert.equal(declaration('.cm-sidebar-area', 'overflow-y'), 'auto');
  assert.equal(declaration('.cm-sidebar-area.cm-layout-area--plain', 'border-inline-end'), '0');
  assert.equal(declaration('.cm-aside-area.cm-layout-area--plain', 'border-inline-start'), '0');
});
