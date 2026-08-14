import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { compareSignificantDom } from '../../../scripts/contracts/significant-dom.mjs';
import { CmFieldset, CmIconButton, CmProgressBar, CmProgressSpinner } from '../dist/index.js';

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const components = {
  fieldset: CmFieldset,
  'icon-button': CmIconButton,
  'progress-bar': CmProgressBar,
  'progress-spinner': CmProgressSpinner,
};

function fieldsetSlotContent(content) {
  if (content === '<label><input name="email_updates" type="checkbox"> Email updates</label>') {
    return h('label', [h('input', { name: 'email_updates', type: 'checkbox' }), ' Email updates']);
  }
  if (content === '<label><input name="contact_method" type="radio" value="email"> Email</label>') {
    return h('label', [h('input', { name: 'contact_method', type: 'radio', value: 'email' }), ' Email']);
  }
  if (content === 'Contact <strong>method</strong>') return ['Contact ', h('strong', 'method')];
  if (content === 'Choose every <em>acceptable</em> method.') {
    return ['Choose every ', h('em', 'acceptable'), ' method.'];
  }
  if (content === 'Choose <strong>at least one</strong> method.') {
    return ['Choose ', h('strong', 'at least one'), ' method.'];
  }

  return content;
}

function slotsFor(slug, definition) {
  return Object.fromEntries(
    Object.entries(definition.slots).map(([name, content]) => [
      name,
      () => {
        if (slug === 'fieldset') return fieldsetSlotContent(content);
        if (slug === 'icon-button' && content === '<svg></svg>') return h('svg');
        return content;
      },
    ]),
  );
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
      const actual = await renderToString(
        createSSRApp({ render: () => h(component, props, slotsFor(slug, definition)) }),
      );
      const comparison = compareSignificantDom(expected, actual);

      assert.equal(comparison.equal, true, comparison.difference);
    });
  }
}

test('escapes portable expansion fallback labels and root attributes during SSR', async () => {
  const actual = await renderToString(
    createSSRApp({
      render: () =>
        h(
          CmFieldset,
          { id: 'unsafe"><id', label: '<script>legend</script>', description: '<b>description</b>' },
          { default: () => h('input', { 'data-note': '"><unsafe>' }) },
        ),
    }),
  );

  assert.match(actual, /id="unsafe&quot;&gt;&lt;id"/u);
  assert.match(actual, /&lt;script&gt;legend&lt;\/script&gt;/u);
  assert.match(actual, /&lt;b&gt;description&lt;\/b&gt;/u);
  assert.match(actual, /data-note="&quot;&gt;&lt;unsafe&gt;"/u);
  assert.doesNotMatch(actual, /<(?:script|b)>/u);
});
