import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

for (const slug of ['dialog', 'drawer', 'popover', 'tooltip']) {
  test(`styles ${slug} only through shared tokens and cm selectors`, async () => {
    const css = await readFile(new URL(`../src/components/${slug}.css`, import.meta.url), 'utf8');

    assert.match(css, new RegExp(`\\.cm-${slug}`, 'u'));
    assert.match(css, /var\(--cm-/u);
    assert.doesNotMatch(css, /(?:--vf-|\.vf-|vue|react|angular)/iu);
  });
}

test('preserves modal, focus, hidden, and logical-placement hooks', async () => {
  const [dialog, drawer, popover, tooltip] = await Promise.all(
    ['dialog', 'drawer', 'popover', 'tooltip'].map((slug) =>
      readFile(new URL(`../src/components/${slug}.css`, import.meta.url), 'utf8'),
    ),
  );

  assert.match(dialog, /\.cm-dialog::backdrop/u);
  assert.match(dialog, /\.cm-dialog__close:focus-visible/u);
  assert.match(drawer, /\.cm-drawer--start/u);
  assert.match(drawer, /inset-inline/u);
  assert.match(popover, /\.cm-popover__panel\[hidden\]/u);
  assert.match(tooltip, /\.cm-tooltip__content\[hidden\]/u);
  assert.doesNotMatch(`${dialog}${drawer}${popover}${tooltip}`, /(?:left|right):/u);
});
