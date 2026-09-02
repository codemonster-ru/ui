import assert from 'node:assert/strict';
import test from 'node:test';
import { collectExportedComponents, findUndocumentedComponents } from './component-documentation.mjs';

test('reads default-exported components from an adapter index', () => {
  const exported = collectExportedComponents([
    "export { default as CmTag } from './components/tag/CmTag.vue';\n" +
      "export type { CmTagTone } from './components/tag/tag.types';\n" +
      "export { default as CmAppShell } from './app-shell/CmAppShell.vue';",
  ]);

  assert.deepEqual([...exported].sort(), ['CmAppShell', 'CmTag']);
});

test('reports the components no guide mentions', () => {
  const exported = new Set(['CmTag', 'CmAppShell', 'CmThemeSwitch']);
  const guides = ['`CmTag` is the outlined counterpart to Badge.', '## AppShell\n\n`CmAppShell` is the widest frame.'];

  assert.deepEqual(findUndocumentedComponents(exported, guides), ['CmThemeSwitch']);
});
