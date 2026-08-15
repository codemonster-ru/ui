import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

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
  assert.match(grid, /repeat\(auto-fit/u);
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
  assert.match(container, /max-inline-size: var\(--cm-breakpoint-xl\)/u);
  assert.match(container, /padding-inline: var\(--cm-space-4\)/u);
  assert.match(grid, /minmax\(calc\(var\(--cm-space-16\) \* 4\), 1fr\)/u);
  assert.match(grid, /gap: var\(--cm-space-4\)/u);
  assert.match(inline, /gap: var\(--cm-space-4\)/u);
  assert.match(section, /padding: var\(--cm-space-4\)/u);
  assert.match(section, /border: var\(--cm-border-width\) solid var\(--cm-color-border-default\)/u);
  assert.match(section, /box-shadow: var\(--cm-shadow-none\)/u);
  assert.doesNotMatch(section, /color: var\(--cm-color-text-primary\)/u);
  assert.match(stack, /gap: var\(--cm-space-4\)/u);
});
