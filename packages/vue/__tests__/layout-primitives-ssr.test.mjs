import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { compareSignificantDom } from '../../../scripts/contracts/significant-dom.mjs';
import { CmContainer, CmGrid, CmInline, CmSection, CmStack } from '../dist/index.js';

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const components = { container: CmContainer, grid: CmGrid, inline: CmInline, section: CmSection, stack: CmStack };

function slotContent(content) {
  const values = {
    '<p>Content</p>': [h('p', 'Content')],
    '<h1>Dashboard</h1>': [h('h1', 'Dashboard')],
    '<p>Wide content</p>': [h('p', 'Wide content')],
    '<p>First</p><p>Second</p>': [h('p', 'First'), h('p', 'Second')],
    '<button type="button">Save</button><a href="/cancel">Cancel</a>': [
      h('button', { type: 'button' }, 'Save'),
      h('a', { href: '/cancel' }, 'Cancel'),
    ],
    '<a href="/one">One</a><a href="/two">Two</a>': [h('a', { href: '/one' }, 'One'), h('a', { href: '/two' }, 'Two')],
    '<h2>Overview</h2><p>Summary</p>': [h('h2', 'Overview'), h('p', 'Summary')],
    '<h2>Report</h2><p>Ready</p>': [h('h2', 'Report'), h('p', 'Ready')],
    '<article>One</article><article>Two</article>': [h('article', 'One'), h('article', 'Two')],
  };
  return values[content];
}

for (const [slug, component] of Object.entries(components)) {
  const casesDirectory = resolve(packageDirectory, `../../contracts/${slug}/cases`);
  const caseFiles = (await readdir(casesDirectory)).filter((file) => file.endsWith('.case.json')).sort();
  for (const caseFile of caseFiles) {
    test(`matches canonical ${slug} DOM for ${caseFile}`, async () => {
      const basename = caseFile.slice(0, -'.case.json'.length);
      const definition = JSON.parse(await readFile(resolve(casesDirectory, caseFile), 'utf8'));
      const expected = await readFile(resolve(casesDirectory, `${basename}.html`), 'utf8');
      const actual = await renderToString(
        createSSRApp({
          render: () => h(component, definition.props, { default: () => slotContent(definition.slots.default) }),
        }),
      );
      const comparison = compareSignificantDom(expected, actual);
      assert.equal(comparison.equal, true, comparison.difference);
    });
  }
}
