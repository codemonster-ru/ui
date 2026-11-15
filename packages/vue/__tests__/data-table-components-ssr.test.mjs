import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { compareSignificantDom } from '../../../scripts/contracts/significant-dom.mjs';
import { VfDataTable } from '../dist/historical.js';
import { CmDataTable, CmTable } from '../dist/index.js';

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function tableSlot(content) {
  const cells = [...content.matchAll(/<(th|td)(?: scope="([^"]+)")?>([^<]+)<\/\1>/gu)].map((match) =>
    h(match[1], match[2] ? { scope: match[2] } : {}, match[3]),
  );
  if (content.startsWith('<strong>')) return h('strong', content.replace(/<\/?strong>/gu, ''));
  return h('tr', cells);
}

test('server-renders historical column reorder controls and preserves fixed headers', async () => {
  const html = await renderToString(
    h(VfDataTable, {
      columns: [
        { key: 'name', header: 'Name' },
        { key: 'actions', reorderable: false },
      ],
      rows: [{ name: 'Ada', actions: 'Edit' }],
      reorderableColumns: true,
    }),
  );

  assert.match(
    html,
    /<th[^>]+tabindex="0"[^>]+aria-label="Name, column 1 of 2"[^>]+aria-keyshortcuts="ArrowLeft ArrowRight"/u,
  );
  assert.match(html, /<th data-cm-data-table-reorder-column="actions" scope="col">/u);
  assert.match(html, /class="cm-data-table__reorder-status" aria-live="polite"/u);
});

test('server-renders the historical page window, custom labels and current page', async () => {
  const html = await renderToString(
    h(VfDataTable, {
      columns: [{ key: 'name' }],
      rows: [{ name: 'Server page' }],
      pagination: true,
      paginationMode: 'manual',
      totalRows: 200,
      page: 10,
      labels: {
        paginationSummary: (first, last, total) => `${first}–${last} of ${total}`,
        pageSummary: (page, count) => `Current page ${page} / ${count}`,
        goToPage: (page) => `Jump to ${page}`,
      },
    }),
  );

  assert.match(html, /<button[^>]*aria-current="page"[^>]*aria-label="Current page 10 \/ 20"[^>]*>10<\/button>/u);
  assert.deepEqual(
    [...html.matchAll(/aria-label="Jump to (\d+)"/gu)].map((match) => match[1]),
    ['1', '9', '11', '20'],
  );
  assert.equal([...html.matchAll(/class="cm-data-table__pagination-ellipsis" aria-hidden="true"/gu)].length, 2);
  assert.match(html, />91–91 of 200<\/span>/u);
});

test('server-renders and escapes historical row action labels and the next sorting action', async () => {
  const html = await renderToString(
    h(
      VfDataTable,
      {
        columns: [
          { key: 'name', sortable: true },
          { key: 'score', header: '<Rating>', sortable: true },
        ],
        rows: [{ name: 'Ada', score: 9 }],
        selectable: true,
        resizableColumns: true,
        multiSort: true,
        defaultSort: [
          { key: 'name', direction: 'asc' },
          { key: 'score', direction: 'desc' },
        ],
        labels: {
          selectRow: (index) => `Select & review ${index}`,
          expandRow: (index) => `Show "record ${index}"`,
          collapseRow: (index) => `Hide "record ${index}"`,
          sortDescending: (column) => `Descending ${column}`,
          clearSort: (column) => `Clear ${column}`,
          resizeColumn: (column) => `Resize "${column}"`,
        },
      },
      { 'expanded-row': () => 'Details' },
    ),
  );

  assert.match(html, /aria-label="Select &amp; review 1"/u);
  assert.match(html, /aria-label="Show &quot;record 1&quot;"/u);
  assert.match(html, /data-cm-data-table-collapse-label="Hide &quot;record 1&quot;"/u);
  assert.match(html, /aria-label="Descending name"/u);
  assert.match(html, /aria-label="Clear &lt;Rating&gt;"/u);
  assert.match(html, /aria-label="Resize &quot;name&quot;"/u);
});

for (const [slug, component] of Object.entries({ 'data-table': CmDataTable, table: CmTable })) {
  const casesDirectory = resolve(packageDirectory, `../../contracts/${slug}/cases`);
  const caseFiles = (await readdir(casesDirectory)).filter((file) => file.endsWith('.case.json')).sort();

  for (const caseFile of caseFiles) {
    test(`matches canonical ${slug} DOM for ${caseFile}`, async () => {
      const basename = caseFile.slice(0, -'.case.json'.length);
      const definition = JSON.parse(await readFile(resolve(casesDirectory, caseFile), 'utf8'));
      const expected = await readFile(resolve(casesDirectory, `${basename}.html`), 'utf8');
      const slots = Object.fromEntries(
        Object.entries(definition.slots).map(([name, content]) => [
          name,
          () => (slug === 'table' ? tableSlot(content) : content),
        ]),
      );
      const actual = await renderToString(createSSRApp({ render: () => h(component, definition.props, slots) }));
      const comparison = compareSignificantDom(expected, actual);
      assert.equal(comparison.equal, true, comparison.difference);
    });
  }
}

test('escapes DataTable cells and labels during SSR', async () => {
  const actual = await renderToString(
    createSSRApp({
      render: () =>
        h(CmDataTable, {
          id: 'safe-table',
          columns: [{ key: 'name', header: '<Name>' }],
          rows: [{ id: 'unsafe-row', cells: { name: '<script>unsafe</script>' } }],
        }),
    }),
  );
  assert.match(actual, /&lt;Name&gt;/u);
  assert.match(actual, /&lt;script&gt;unsafe&lt;\/script&gt;/u);
  assert.doesNotMatch(actual, /<script>/u);
});
