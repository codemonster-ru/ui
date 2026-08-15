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
  assert.match(select, /\.cm-select-wrap:focus-within/u);
  assert.match(select, /\.cm-select__clear\[hidden\]/u);
  assert.match(datePicker, /\.cm-date-picker:read-only/u);
  assert.match(palette, /\.cm-command-palette::backdrop/u);
  assert.match(palette, /\.cm-command-palette__option\[hidden\]/u);
  assert.match(palette, /\.cm-command-palette__idle\[hidden\]/u);
  assert.match(palette, /\.cm-command-palette__footer/u);
});

test('preserves the fd793696 CommandPalette geometry through CodeMonster tokens', async () => {
  const css = await readFile(new URL('../src/components/command-palette.css', import.meta.url), 'utf8');

  assert.match(css, /inset-block: calc\(var\(--cm-space-4\) \+ var\(--cm-control-height-sm\)\) auto/u);
  assert.match(css, /var\(--cm-space-16\) \* 12/u);
  assert.match(css, /var\(--cm-color-border-strong\)/u);
  assert.match(css, /background: var\(--cm-color-background-backdrop\)/u);
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\) auto/u);
  assert.match(css, /\.cm-command-palette__title[\s\S]*clip-path: inset\(50%\)/u);
  assert.match(css, /\.cm-command-palette__option[\s\S]*padding: var\(--cm-field-padding-md\)/u);
  assert.match(css, /\.cm-command-palette__option[\s\S]*min-block-size: var\(--cm-control-height-md\)/u);
  assert.match(css, /\.cm-command-palette__footer[\s\S]*min-block-size: var\(--cm-space-16\)/u);
  assert.match(css, /\.cm-command-palette__footer::before/u);
});
