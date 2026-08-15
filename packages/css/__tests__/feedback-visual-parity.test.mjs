import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const readComponent = (slug) => readFile(new URL(`../src/components/${slug}.css`, import.meta.url), 'utf8');

test('preserves the reference Badge and Avatar geometry', async () => {
  const [badge, avatar] = await Promise.all([readComponent('badge'), readComponent('avatar')]);

  assert.match(badge, /min-block-size: 1\.375rem;/u);
  assert.match(badge, /padding: 0\.0625rem 0\.25rem;/u);
  assert.match(badge, /border-radius: var\(--cm-radius-control-tight\);/u);
  assert.match(badge, /font-weight: var\(--cm-font-weight-regular\);/u);
  assert.match(avatar, /--cm-avatar-current-size: var\(--cm-control-height-md\);/u);
  assert.match(avatar, /--cm-avatar-current-font-size: var\(--cm-font-size-xl\);/u);
  assert.match(avatar, /\.cm-avatar--circle[\s\S]*border-radius: 50%;/u);
});

test('preserves the reference Alert surface and content geometry', async () => {
  const alert = await readComponent('alert');

  assert.match(alert, /padding: var\(--cm-space-3\) var\(--cm-space-4\);/u);
  assert.match(alert, /box-shadow: var\(--cm-shadow-surface\);/u);
  assert.match(alert, /margin-block-start: calc\(\(var\(--cm-line-height-normal\) - 1\) \* 0\.5em\);/u);
  assert.match(alert, /max-inline-size: 68ch;/u);
  assert.match(alert, /\.cm-alert--warning \.cm-alert__icon/u);
});

test('preserves the reference progress indicator animation geometry', async () => {
  const [bar, spinner] = await Promise.all([readComponent('progress-bar'), readComponent('progress-spinner')]);

  assert.match(bar, /--cm-progress-bar-height: 0\.5rem;/u);
  assert.match(bar, /\.cm-progress-bar--striped \.cm-progress-bar__value/u);
  assert.match(bar, /animation: cm-progress-bar-indeterminate 2\.1s/u);
  assert.match(bar, /animation: cm-progress-bar-indeterminate-short 2\.1s/u);
  assert.match(spinner, /--cm-progress-spinner-size: 2rem;/u);
  assert.match(spinner, /stroke-dasharray: 88 200;/u);
  assert.match(spinner, /animation: cm-progress-spinner-dash 1\.4s ease-in-out infinite;/u);
});

test('preserves the reference Skeleton shimmer including RTL', async () => {
  const skeleton = await readComponent('skeleton');

  assert.match(skeleton, /background: var\(--cm-color-background-surface-disabled\);/u);
  assert.match(skeleton, /transparent 24%/u);
  assert.match(skeleton, /transparent 76%/u);
  assert.match(skeleton, /\[dir='rtl'\] \.cm-skeleton--animated::after/u);
  assert.match(skeleton, /@keyframes cm-skeleton-shimmer-rtl/u);
});
