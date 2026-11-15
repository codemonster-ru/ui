import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToString } from '@vue/server-renderer';
import { h } from 'vue';
import { CmTable, VfTable } from '@codemonster-ru/ui-vue';

test('historical compact Vue table keeps the same named regions as the current density option', async () => {
  const props = { id: 'invoices', caption: 'Invoices', striped: true, columnDividers: true, stickyHeader: true };
  const slots = {
    header: () => h('tr', h('th', { scope: 'col' }, 'Total')),
    default: () => h('tr', h('td', '$18')),
    footer: () => h('tr', h('td', 'Grand total: $18')),
  };
  const historical = await renderToString(h(VfTable, { ...props, compact: true }, slots));
  assert.equal(historical, await renderToString(h(CmTable, { ...props, density: 'compact' }, slots)));
  assert.match(historical.replaceAll(/<!--.*?-->/gu, ''), /<caption[^>]*>Invoices<\/caption>.*<thead.*<tbody.*<tfoot/u);
  assert.match(historical, /cm-table--compact/u);
  const explicitDensity = await renderToString(h(VfTable, { ...props, compact: true, density: 'default' }, slots));
  assert.doesNotMatch(explicitDensity, /cm-table--compact/u);
});
