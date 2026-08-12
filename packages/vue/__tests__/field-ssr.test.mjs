import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { compareSignificantDom } from '../../../scripts/contracts/significant-dom.mjs';
import { CmField } from '../dist/index.js';

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const casesDirectory = resolve(packageDirectory, '../../contracts/field/cases');

function controlFor(definition) {
  if (definition.id === 'field-help-error') {
    return h('input', {
      id: 'profile-name',
      name: 'display_name',
      type: 'text',
      required: true,
      'aria-invalid': 'true',
      'aria-describedby': 'profile-name-description profile-name-error',
    });
  }

  return h('input', { id: 'account-email', name: 'email', type: 'email' });
}

async function renderField(props, slots) {
  return renderToString(createSSRApp({ render: () => h(CmField, props, slots) }));
}

const caseFiles = (await readdir(casesDirectory)).filter((file) => file.endsWith('.case.json')).sort();

for (const caseFile of caseFiles) {
  test(`matches canonical Field DOM for ${caseFile}`, async () => {
    const basename = caseFile.slice(0, -'.case.json'.length);
    const definition = JSON.parse(await readFile(resolve(casesDirectory, caseFile), 'utf8'));
    const expected = await readFile(resolve(casesDirectory, `${basename}.html`), 'utf8');
    const actual = await renderField(definition.props, { default: () => controlFor(definition) });
    const comparison = compareSignificantDom(expected, actual);

    assert.equal(comparison.equal, true, comparison.difference);
  });
}

test('escapes Field fallback content and identifiers during SSR', async () => {
  const actual = await renderField(
    { controlId: 'unsafe"><id', label: '<script>label</script>', error: '<b>error</b>' },
    { default: ({ controlId }) => h('input', { id: controlId }) },
  );

  assert.match(actual, /for="unsafe&quot;&gt;&lt;id"/u);
  assert.match(actual, /&lt;script&gt;label&lt;\/script&gt;/u);
  assert.match(actual, /&lt;b&gt;error&lt;\/b&gt;/u);
  assert.doesNotMatch(actual, /<(?:script|b)>/u);
});
