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

test('preserves the fd793696 table geometry through CodeMonster tokens', async () => {
  const [table, dataTable] = await Promise.all(
    ['table', 'data-table'].map((slug) => readFile(new URL(`../src/components/${slug}.css`, import.meta.url), 'utf8')),
  );

  for (const css of [table, dataTable]) {
    assert.match(css, /min-inline-size: calc\(var\(--cm-space-16\) \* 9\)/u);
    assert.match(css, /font-size: var\(--cm-font-size-xl\)/u);
    assert.match(css, /font-weight: var\(--cm-font-weight-regular\)/u);
    assert.match(css, /padding: var\(--cm-field-padding-lg\)/u);
    assert.match(css, /padding: var\(--cm-field-padding-md\)/u);
    assert.match(css, /vertical-align: top/u);
    assert.match(css, /var\(--cm-color-background-surface\) 65%/u);
  }

  assert.match(table, /\.cm-table__body > tr \+ tr > td/u);
  assert.match(table, /\.cm-table__foot > tr:first-child > td/u);
  assert.match(dataTable, /\.cm-data-table__body > tr \+ tr > td/u);
  assert.match(dataTable, /inline-size: calc\(var\(--cm-space-4\) \+ var\(--cm-space-1\)\)/u);
  assert.doesNotMatch(dataTable, /\.cm-data-table__row--selected\s*\{[^}]*background:/u);
  assert.match(dataTable, /min-block-size: calc\(var\(--cm-control-height-sm\) \+ var\(--cm-field-padding-block-lg\) \* 2\)/u);
});
