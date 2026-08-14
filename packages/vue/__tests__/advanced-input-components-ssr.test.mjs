import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { compareSignificantDom } from '../../../scripts/contracts/significant-dom.mjs';
import { CmCommandPalette, CmDatePicker, CmSelect } from '../dist/index.js';

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const components = { 'command-palette': CmCommandPalette, 'date-picker': CmDatePicker, select: CmSelect };

function slotContent(content) {
  if (content === '<kbd>⌘K</kbd>') return h('kbd', '⌘K');
  if (content === '<strong>Open</strong> settings <kbd>S</kbd>') {
    return [h('strong', 'Open'), ' settings ', h('kbd', 'S')];
  }
  if (content === '<strong>Finding commands…</strong>') return h('strong', 'Finding commands…');
  return content;
}

for (const [slug, component] of Object.entries(components)) {
  const casesDirectory = resolve(packageDirectory, `../../contracts/${slug}/cases`);
  const caseFiles = (await readdir(casesDirectory)).filter((file) => file.endsWith('.case.json')).sort();

  for (const caseFile of caseFiles) {
    test(`matches canonical ${slug} DOM for ${caseFile}`, async () => {
      const basename = caseFile.slice(0, -'.case.json'.length);
      const definition = JSON.parse(await readFile(resolve(casesDirectory, caseFile), 'utf8'));
      const expected = await readFile(resolve(casesDirectory, `${basename}.html`), 'utf8');
      const props = { ...definition.attributes, ...definition.props };
      if (slug === 'select' || slug === 'date-picker') {
        props.modelValue = props.value ?? '';
        delete props.value;
      }
      const slots = Object.fromEntries(
        Object.entries(definition.slots).map(([name, content]) => [name, () => slotContent(content)]),
      );
      const actual = await renderToString(createSSRApp({ render: () => h(component, props, slots) }));
      const comparison = compareSignificantDom(expected, actual);
      assert.equal(comparison.equal, true, comparison.difference);
    });
  }
}

test('escapes advanced-input option, command, and attribute values during SSR', async () => {
  const actual = await renderToString(
    createSSRApp({
      render: () => h(CmSelect, { options: [{ value: '"><script>', label: '<Unsafe>' }], 'aria-label': 'Safe' }),
    }),
  );
  assert.match(actual, /&lt;Unsafe&gt;/u);
  assert.match(actual, /&quot;&gt;&lt;script&gt;/u);
  assert.doesNotMatch(actual, /<script>/u);
});
