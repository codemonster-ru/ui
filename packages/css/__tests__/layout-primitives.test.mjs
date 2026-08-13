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
