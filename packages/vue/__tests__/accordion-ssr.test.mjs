import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { compareSignificantDom } from '../../../scripts/contracts/significant-dom.mjs';
import { CmAccordion } from '../dist/index.js';

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const casesDirectory = resolve(packageDirectory, '../../contracts/accordion/cases');

async function renderAccordion(props) {
  return renderToString(createSSRApp({ render: () => h(CmAccordion, props) }));
}

const caseFiles = (await readdir(casesDirectory)).filter((file) => file.endsWith('.case.json')).sort();

for (const caseFile of caseFiles) {
  test(`matches canonical Accordion DOM for ${caseFile}`, async () => {
    const basename = caseFile.slice(0, -'.case.json'.length);
    const definition = JSON.parse(await readFile(resolve(casesDirectory, caseFile), 'utf8'));
    const expected = await readFile(resolve(casesDirectory, `${basename}.html`), 'utf8');
    const actual = await renderAccordion(definition.props);
    const comparison = compareSignificantDom(expected, actual);

    assert.equal(comparison.equal, true, comparison.difference);
  });
}

test('escapes Accordion item text and root attributes during SSR', async () => {
  const actual = await renderAccordion({
    id: 'faq',
    items: [{ id: 'unsafe', title: '<script>title</script>', content: '<img src=x onerror=alert(1)>' }],
    title: '"quoted" <root>',
  });

  assert.match(actual, /title="&quot;quoted&quot; &lt;root&gt;"/u);
  assert.match(actual, /&lt;script&gt;title&lt;\/script&gt;/u);
  assert.match(actual, /&lt;img src=x onerror=alert\(1\)&gt;/u);
  assert.doesNotMatch(actual, /<script>|<img/u);
});
