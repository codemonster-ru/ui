import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { compareSignificantDom } from '../../../scripts/contracts/significant-dom.mjs';
import { CmButton } from '../dist/index.js';

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const casesDirectory = resolve(packageDirectory, '../../contracts/button/cases');

function createSlots(caseDefinition) {
  const slots = {
    default: () => caseDefinition.slots.default,
  };

  if (caseDefinition.slots.leading) {
    slots.leading = () => h('span', { 'aria-hidden': 'true' }, '←');
  }
  if (caseDefinition.slots.trailing) {
    slots.trailing = () => h('span', { 'aria-hidden': 'true' }, '→');
  }

  return slots;
}

async function renderButton(props, slots) {
  return renderToString(
    createSSRApp({
      render: () => h(CmButton, props, slots),
    }),
  );
}

const caseFiles = (await readdir(casesDirectory)).filter((file) => file.endsWith('.case.json')).sort();

for (const caseFile of caseFiles) {
  test(`matches canonical Button DOM for ${caseFile}`, async () => {
    const basename = caseFile.slice(0, -'.case.json'.length);
    const caseDefinition = JSON.parse(await readFile(resolve(casesDirectory, caseFile), 'utf8'));
    const expected = await readFile(resolve(casesDirectory, `${basename}.html`), 'utf8');
    const actual = await renderButton(caseDefinition.props, createSlots(caseDefinition));
    const comparison = compareSignificantDom(expected, actual);

    assert.equal(comparison.equal, true, comparison.difference);
  });
}

test('escapes Button attributes and slot text during SSR', async () => {
  const actual = await renderButton(
    { title: '"quoted" <title>' },
    { default: () => '<script>alert("unsafe")</script>' },
  );

  assert.match(actual, /title="&quot;quoted&quot; &lt;title&gt;"/u);
  assert.match(actual, /&lt;script&gt;alert\(&quot;unsafe&quot;\)&lt;\/script&gt;/u);
  assert.doesNotMatch(actual, /<script>/u);
});
