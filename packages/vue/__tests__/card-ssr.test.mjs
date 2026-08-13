import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { compareSignificantDom } from '../../../scripts/contracts/significant-dom.mjs';
import { CmCard } from '../dist/index.js';

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const casesDirectory = resolve(packageDirectory, '../../contracts/card/cases');

function slotContent(content) {
  if (content === '<p>Project summary</p>') return h('p', 'Project summary');
  if (content === '<h2>Project</h2>') return h('h2', 'Project');
  if (content === '<p>Summary</p>') return h('p', 'Summary');
  if (content === '<button type="button">Continue</button>') return h('button', { type: 'button' }, 'Continue');
  return content;
}

function createSlots(caseDefinition) {
  return Object.fromEntries(
    Object.entries(caseDefinition.slots).map(([name, content]) => [name, () => slotContent(content)]),
  );
}

async function renderCard(props, slots) {
  return renderToString(createSSRApp({ render: () => h(CmCard, props, slots) }));
}

const caseFiles = (await readdir(casesDirectory)).filter((file) => file.endsWith('.case.json')).sort();

for (const caseFile of caseFiles) {
  test(`matches canonical Card DOM for ${caseFile}`, async () => {
    const basename = caseFile.slice(0, -'.case.json'.length);
    const caseDefinition = JSON.parse(await readFile(resolve(casesDirectory, caseFile), 'utf8'));
    const expected = await readFile(resolve(casesDirectory, `${basename}.html`), 'utf8');
    const actual = await renderCard(caseDefinition.props, createSlots(caseDefinition));
    const comparison = compareSignificantDom(expected, actual);

    assert.equal(comparison.equal, true, comparison.difference);
  });
}

test('escapes Card title and root attributes during SSR', async () => {
  const actual = await renderCard({ title: '<script>unsafe</script>', 'data-note': '"quoted" <note>' }, {});

  assert.match(actual, /&lt;script&gt;unsafe&lt;\/script&gt;/u);
  assert.match(actual, /data-note="&quot;quoted&quot; &lt;note&gt;"/u);
  assert.doesNotMatch(actual, /<script>/u);
});
