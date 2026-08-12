import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

for (const slug of ['alert', 'avatar', 'badge', 'divider', 'skeleton']) {
  test(`styles ${slug} only through shared tokens and cm selectors`, async () => {
    const css = await readFile(new URL(`../src/components/${slug}.css`, import.meta.url), 'utf8');

    assert.match(css, new RegExp(`\\.cm-${slug}`, 'u'));
    assert.match(css, /var\(--cm-/u);
    assert.doesNotMatch(css, /(?:--vf-|\.vf-|vue|react|angular)/iu);
  });
}

test('disables Skeleton shimmer for reduced motion', async () => {
  const css = await readFile(new URL('../src/components/skeleton.css', import.meta.url), 'utf8');

  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation: none;/u);
});
