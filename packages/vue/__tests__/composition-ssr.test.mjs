import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, createStaticVNode, h } from 'vue';
import { compareSignificantDom } from '../../../scripts/contracts/significant-dom.mjs';
import { CmFormLayout, CmPageHeader, CmPanel, CmSkeletonGate } from '../dist/index.js';

const components = {
  'form-layout': CmFormLayout,
  'page-header': CmPageHeader,
  panel: CmPanel,
  'skeleton-gate': CmSkeletonGate,
};

for (const [slug, component] of Object.entries(components)) {
  const cases = resolve(import.meta.dirname, `../../../contracts/${slug}/cases`);
  const filenames = (await readdir(cases)).filter((filename) => filename.endsWith('.case.json')).sort();
  for (const filename of filenames) {
    test(`matches canonical ${slug} DOM for ${filename}`, async () => {
      const definition = JSON.parse(await readFile(resolve(cases, filename), 'utf8'));
      const expected = await readFile(resolve(cases, filename.replace('.case.json', '.html')), 'utf8');
      const slots = Object.fromEntries(
        Object.entries(definition.slots).map(([name, markup]) => [name, () => createStaticVNode(markup, 1)]),
      );
      const actual = await renderToString(createSSRApp({ render: () => h(component, definition.props, slots) }));
      const comparison = compareSignificantDom(expected, actual);
      assert.equal(comparison.equal, true, comparison.difference);
    });
  }
}
