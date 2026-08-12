import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

for (const slug of ['command-palette', 'date-picker', 'select']) {
  test(`styles ${slug} only through shared tokens and cm selectors`, async () => {
    const css = await readFile(new URL(`../src/components/${slug}.css`, import.meta.url), 'utf8');
    assert.match(css, new RegExp(`\\.cm-${slug}`, 'u'));
    assert.match(css, /var\(--cm-/u);
    assert.doesNotMatch(css, /(?:--vf-|\.vf-|vue|react|angular)/iu);
  });
}

test('preserves native control and command interaction hooks', async () => {
  const [select, datePicker, palette] = await Promise.all(
    ['select', 'date-picker', 'command-palette'].map((slug) =>
      readFile(new URL(`../src/components/${slug}.css`, import.meta.url), 'utf8'),
    ),
  );
  assert.match(select, /\.cm-select:focus-visible/u);
  assert.match(datePicker, /\.cm-date-picker:read-only/u);
  assert.match(palette, /\.cm-command-palette::backdrop/u);
  assert.match(palette, /\.cm-command-palette__option\[hidden\]/u);
});
