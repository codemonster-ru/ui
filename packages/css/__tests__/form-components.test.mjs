import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

for (const slug of ['checkbox', 'radio', 'switch', 'textarea']) {
  test(`styles ${slug} only through shared tokens and cm selectors`, async () => {
    const css = await readFile(new URL(`../src/components/${slug}.css`, import.meta.url), 'utf8');

    assert.match(css, new RegExp(`\\.cm-${slug}`, 'u'));
    assert.match(css, /var\(--cm-/u);
    assert.match(css, /focus-visible/u);
    assert.doesNotMatch(css, /(?:--vf-|\.vf-|vue|react|angular)/iu);
  });
}

for (const slug of ['checkbox', 'radio', 'switch']) {
  test(`keeps the native ${slug} input focusable`, async () => {
    const css = await readFile(new URL(`../src/components/${slug}.css`, import.meta.url), 'utf8');

    assert.match(css, new RegExp(`\\.cm-${slug}__input[\\s\\S]*opacity: 0;`, 'u'));
    assert.doesNotMatch(css, new RegExp(`\\.cm-${slug}__input[\\s\\S]*display: none;`, 'u'));
  });
}
