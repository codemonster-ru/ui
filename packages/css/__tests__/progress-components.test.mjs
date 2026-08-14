import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const cssUrl = (name) => new URL(`../src/components/${name}.css`, import.meta.url);

test('progress styles use cm selectors, shared tokens, and bounded variants', async () => {
  const [bar, spinner] = await Promise.all([
    readFile(cssUrl('progress-bar'), 'utf8'),
    readFile(cssUrl('progress-spinner'), 'utf8'),
  ]);

  for (const css of [bar, spinner]) {
    assert.match(css, /\.cm-progress-/);
    assert.match(css, /var\(--cm-/);
    assert.doesNotMatch(css, /\.vf-|#[0-9a-f]{3,8}\b|\brgb\(|\bhsl\(/i);
  }

  for (const tone of ['neutral', 'success', 'info', 'warning', 'help', 'danger', 'contrast']) {
    assert.match(bar, new RegExp(`\\.cm-progress-bar--${tone}\\b`));
    assert.match(spinner, new RegExp(`\\.cm-progress-spinner--${tone}\\b`));
  }

  for (const size of ['sm', 'md', 'lg']) {
    assert.match(spinner, new RegExp(`\\.cm-progress-spinner--${size}\\b`));
  }

  assert.match(bar, /@keyframes cm-progress-bar-indeterminate/);
  assert.match(spinner, /@keyframes cm-progress-spinner-rotate/);
  assert.match(spinner, /@keyframes cm-progress-spinner-dash/);
  assert.match(bar, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(spinner, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(spinner, /animation: none/);
});
