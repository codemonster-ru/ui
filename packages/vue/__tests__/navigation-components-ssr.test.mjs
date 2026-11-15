import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { renderToString } from '@vue/server-renderer';
import { JSDOM } from 'jsdom';
import { createSSRApp, createStaticVNode, h } from 'vue';
import { compareSignificantDom } from '../../../scripts/contracts/significant-dom.mjs';
import { CmBreadcrumbs, CmDropdown, CmLink, CmMenu, CmTabs } from '../dist/index.js';

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const components = { breadcrumbs: CmBreadcrumbs, dropdown: CmDropdown, link: CmLink, menu: CmMenu, tabs: CmTabs };

function slotContent(content) {
  if (content === '<strong>Open <span>project</span></strong>') {
    return h('strong', ['Open ', h('span', 'project')]);
  }
  if (content === '<span aria-hidden="true">•••</span>') return h('span', { 'aria-hidden': 'true' }, '•••');
  if (content === '<span>Details <small>new</small></span>') {
    return h('span', ['Details ', h('small', 'new')]);
  }
  if (content === '<p>Rich <strong>details</strong>.</p>') {
    return h('p', ['Rich ', h('strong', 'details'), '.']);
  }
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
      if (slug === 'tabs') {
        props.modelValue = props.value ?? null;
        delete props.value;
      }
      const slots = Object.fromEntries(
        Object.entries(definition.slots).map(([name, content]) => [
          name,
          () => (slug === 'dropdown' && name === 'default' ? createStaticVNode(content, 2) : slotContent(content)),
        ]),
      );
      const actual = await renderToString(createSSRApp({ render: () => h(component, props, slots) }));
      const comparison = compareSignificantDom(expected, actual);
      assert.equal(comparison.equal, true, comparison.difference);
    });
  }
}

test('escapes navigation labels, content, and attributes during SSR', async () => {
  const actual = await renderToString(
    createSSRApp({ render: () => h(CmLink, { href: '"><script>unsafe</script>' }, () => '<Unsafe>') }),
  );
  assert.match(actual, /href="&quot;&gt;&lt;script&gt;unsafe&lt;\/script&gt;"/u);
  assert.match(actual, /&lt;Unsafe&gt;/u);
  assert.doesNotMatch(actual, /<script>/u);
});

test('keeps non-kebab tab values while generating unambiguous panel relationships', async () => {
  const actual = await renderToString(
    h(CmTabs, {
      id: 'checklist',
      modelValue: 'État & suite',
      items: [
        { value: '1', label: 'First', content: 'Content one' },
        { value: 'État & suite', label: 'Second', content: 'Content two' },
      ],
    }),
  );
  const { document } = new JSDOM(actual).window;
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  assert.deepEqual(
    tabs.map((tab) => tab.getAttribute('data-cm-tab-value')),
    ['1', 'État & suite'],
  );
  assert.notEqual(tabs[0].id, tabs[1].id);
  for (const tab of tabs) {
    assert.doesNotMatch(tab.id, /\s/u);
    assert.equal(document.getElementById(tab.getAttribute('aria-controls')).getAttribute('aria-labelledby'), tab.id);
  }
  assert.equal(tabs[1].getAttribute('aria-selected'), 'true');
});
