import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { compareSignificantDom } from '../../../scripts/contracts/significant-dom.mjs';
import { CmInput } from '../dist/index.js';

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const casesDirectory = resolve(packageDirectory, '../../contracts/input/cases');

function createSlots(definition) {
  const slots = {};
  if (definition.slots.leading) slots.leading = () => h('span', { 'aria-hidden': 'true' }, '@');
  if (definition.slots.trailing) slots.trailing = () => h('span', { 'aria-hidden': 'true' }, 'required');
  return slots;
}

async function renderInput(props, slots = {}) {
  return renderToString(createSSRApp({ render: () => h(CmInput, props, slots) }));
}

const caseFiles = (await readdir(casesDirectory)).filter((file) => file.endsWith('.case.json')).sort();

for (const caseFile of caseFiles) {
  test(`matches canonical Input DOM for ${caseFile}`, async () => {
    const basename = caseFile.slice(0, -'.case.json'.length);
    const definition = JSON.parse(await readFile(resolve(casesDirectory, caseFile), 'utf8'));
    const expected = await readFile(resolve(casesDirectory, `${basename}.html`), 'utf8');
    const { value = '', ...props } = definition.props;
    const actual = await renderInput(
      { ...definition.attributes, ...props, modelValue: value },
      createSlots(definition),
    );
    const comparison = compareSignificantDom(expected, actual);

    assert.equal(comparison.equal, true, comparison.difference);
  });
}

test('escapes Input values and attributes during SSR', async () => {
  const actual = await renderInput({
    modelValue: '"><script>unsafe</script>',
    'aria-label': '"quoted" <label>',
  });

  assert.match(actual, /value="&quot;&gt;&lt;script&gt;unsafe&lt;\/script&gt;"/u);
  assert.match(actual, /aria-label="&quot;quoted&quot; &lt;label&gt;"/u);
  assert.doesNotMatch(actual, /<script>/u);
});
