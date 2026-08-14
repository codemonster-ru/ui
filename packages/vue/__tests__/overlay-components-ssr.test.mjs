import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { compareSignificantDom } from '../../../scripts/contracts/significant-dom.mjs';
import { CmDialog, CmDrawer, CmPopover, CmTooltip } from '../dist/index.js';

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const components = { dialog: CmDialog, drawer: CmDrawer, popover: CmPopover, tooltip: CmTooltip };

function slotContent(content) {
  const richContent = {
    'Publish <strong>release</strong>?': () => ['Publish ', h('strong', 'release'), '?'],
    'Review the <strong>public changes</strong>.': () => ['Review the ', h('strong', 'public changes'), '.'],
    '<button type="button">Preview</button>': () => h('button', { type: 'button' }, 'Preview'),
    'Account <strong>settings</strong>': () => ['Account ', h('strong', 'settings')],
    'Changes apply to the <strong>workspace</strong>.': () => ['Changes apply to the ', h('strong', 'workspace'), '.'],
    '<button type="button">Reset</button>': () => h('button', { type: 'button' }, 'Reset'),
    '<span aria-hidden="true">●</span><span>Profile</span>': () => [
      h('span', { 'aria-hidden': 'true' }, '●'),
      h('span', 'Profile'),
    ],
    '<span aria-hidden="true">×</span>': () => h('span', { 'aria-hidden': 'true' }, '×'),
    'Archive <strong>this project</strong>': () => ['Archive ', h('strong', 'this project')],
  };
  return richContent[content]?.() ?? content;
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
      const slots = Object.fromEntries(
        Object.entries(definition.slots).map(([name, content]) => [name, () => slotContent(content)]),
      );
      const actual = await renderToString(createSSRApp({ render: () => h(component, props, slots) }));
      const comparison = compareSignificantDom(expected, actual);
      assert.equal(comparison.equal, true, comparison.difference);
    });
  }
}

test('escapes overlay labels, content, and attributes during SSR', async () => {
  const actual = await renderToString(
    createSSRApp({
      render: () =>
        h(CmTooltip, { id: 'unsafe', label: '<Label>', content: '<script>unsafe</script>', title: '"bad"' }),
    }),
  );
  assert.match(actual, /&lt;Label&gt;/u);
  assert.match(actual, /&lt;script&gt;unsafe&lt;\/script&gt;/u);
  assert.doesNotMatch(actual, /<script>/u);
});
