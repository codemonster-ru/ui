import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { compareSignificantDom } from '../../../scripts/contracts/significant-dom.mjs';
import { CmCheckbox, CmRadio, CmSwitch, CmTextarea } from '../dist/index.js';

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const components = {
  checkbox: CmCheckbox,
  radio: CmRadio,
  switch: CmSwitch,
  textarea: CmTextarea,
};

for (const [slug, component] of Object.entries(components)) {
  const casesDirectory = resolve(packageDirectory, `../../contracts/${slug}/cases`);
  const caseFiles = (await readdir(casesDirectory)).filter((file) => file.endsWith('.case.json')).sort();

  for (const caseFile of caseFiles) {
    test(`matches canonical ${slug} DOM for ${caseFile}`, async () => {
      const basename = caseFile.slice(0, -'.case.json'.length);
      const definition = JSON.parse(await readFile(resolve(casesDirectory, caseFile), 'utf8'));
      const expected = await readFile(resolve(casesDirectory, `${basename}.html`), 'utf8');
      const props = { ...definition.attributes, ...definition.props };

      if (slug === 'textarea') {
        props.modelValue = props.value ?? '';
        delete props.value;
      } else if (slug === 'radio') {
        props.modelValue = props.checked ? props.value : undefined;
        delete props.checked;
      } else {
        props.modelValue = props.checked ?? false;
        delete props.checked;
      }

      const slots = Object.fromEntries(
        Object.entries(definition.slots).map(([name, content]) => [name, () => content]),
      );
      const actual = await renderToString(createSSRApp({ render: () => h(component, props, slots) }));
      const comparison = compareSignificantDom(expected, actual);

      assert.equal(comparison.equal, true, comparison.difference);
    });
  }
}

test('escapes form-control labels, values, and attributes during SSR', async () => {
  const actual = await renderToString(
    createSSRApp({
      render: () =>
        h(CmCheckbox, {
          label: '<script>unsafe</script>',
          value: '"><img src=x>',
          name: '"quoted"',
        }),
    }),
  );

  assert.match(actual, /&lt;script&gt;unsafe&lt;\/script&gt;/u);
  assert.match(actual, /value="&quot;&gt;&lt;img src=x&gt;"/u);
  assert.match(actual, /name="&quot;quoted&quot;"/u);
  assert.doesNotMatch(actual, /<script>/u);
});
