import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { compareSignificantDom } from '../../../scripts/contracts/significant-dom.mjs';
import { CmDataTable, CmTable } from '../dist/index.js';

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function tableSlot(content) {
  const cells = [...content.matchAll(/<(th|td)(?: scope="([^"]+)")?>([^<]+)<\/\1>/gu)].map((match) =>
    h(match[1], match[2] ? { scope: match[2] } : {}, match[3]),
  );
  if (content.startsWith('<strong>')) return h('strong', content.replace(/<\/?strong>/gu, ''));
  return h('tr', cells);
}

for (const [slug, component] of Object.entries({ 'data-table': CmDataTable, table: CmTable })) {
  const casesDirectory = resolve(packageDirectory, `../../contracts/${slug}/cases`);
  const caseFiles = (await readdir(casesDirectory)).filter((file) => file.endsWith('.case.json')).sort();

  for (const caseFile of caseFiles) {
    test(`matches canonical ${slug} DOM for ${caseFile}`, async () => {
      const basename = caseFile.slice(0, -'.case.json'.length);
      const definition = JSON.parse(await readFile(resolve(casesDirectory, caseFile), 'utf8'));
      const expected = await readFile(resolve(casesDirectory, `${basename}.html`), 'utf8');
      const slots =
        slug === 'table'
          ? Object.fromEntries(
              Object.entries(definition.slots).map(([name, content]) => [name, () => tableSlot(content)]),
            )
          : {};
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
