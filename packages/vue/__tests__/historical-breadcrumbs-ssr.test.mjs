import assert from 'node:assert/strict';
import test from 'node:test';
import { VfBreadcrumbs } from '@codemonster-ru/ui-vue/historical';
import { renderToString } from '@vue/server-renderer';
import { JSDOM } from 'jsdom';
import { h } from 'vue';

test('renders the historical breadcrumb chevron and current page through the public subpath', async () => {
  const output = await renderToString(
    h(VfBreadcrumbs, { items: [{ label: 'Home', href: '/' }, { label: 'Settings' }] }),
  );
  const root = JSDOM.fragment(output).firstElementChild;
  assert.equal(root.getAttribute('aria-label'), 'Breadcrumb');
  assert.equal(root.querySelector('a')?.getAttribute('href'), '/');
  assert.equal(root.querySelector('.cm-breadcrumbs__separator')?.getAttribute('aria-hidden'), 'true');
  assert.equal(root.querySelector('svg')?.getAttribute('focusable'), 'false');
  assert.equal(root.querySelector('polyline')?.getAttribute('points'), '8.75 5.75 15 12 8.75 18.25');
  assert.equal(root.querySelectorAll('[aria-current=page]').length, 1);
  assert.equal(root.querySelector('[aria-current=page]')?.textContent, 'Settings');
});
