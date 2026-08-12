import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

for (const slug of ['data-table', 'table']) {
  test(`styles ${slug} only through shared tokens and cm selectors`, async () => {
    const css = await readFile(new URL(`../src/components/${slug}.css`, import.meta.url), 'utf8');
    assert.match(css, new RegExp(`\\.cm-${slug}`, 'u'));
    assert.match(css, /var\(--cm-/u);
    assert.doesNotMatch(css, /(?:--vf-|\.vf-|vue|react|angular)/iu);
  });
}

test('preserves responsive table and interactive data-table hooks', async () => {
  const [table, dataTable] = await Promise.all(
    ['table', 'data-table'].map((slug) => readFile(new URL(`../src/components/${slug}.css`, import.meta.url), 'utf8')),
  );

  assert.match(table, /overflow-x: auto/u);
  assert.match(table, /\.cm-table--sticky-header/u);
  assert.match(dataTable, /\[aria-sort='ascending'\]/u);
  assert.match(dataTable, /\.cm-data-table__row--selected/u);
  assert.match(dataTable, /\.cm-data-table__page-button:focus-visible/u);
  assert.match(dataTable, /@media \(forced-colors: active\)/u);
});
