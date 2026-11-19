import assert from 'node:assert/strict';
import test from 'node:test';
import { collectExportedComponents, findUndocumentedComponents } from './component-documentation.mjs';

test('reads component exports even when grouped with compatibility aliases', () => {
  const exported = collectExportedComponents([
    `
      export { default as CmTag } from './components/tag/CmTag.vue';
      export type { CmTagTone } from './components/tag/tag.types';
      export { default as VfAppShell, default as CmAppShell } from './app-shell/CmAppShell.vue';
      export {
        default as CmAdminShell,
        default as VfAdminShell,
      } from './admin-shell/CmAdminShell.vue';
      export { default as CmHelper } from './helper';
      // export { default as CmRemoved } from './CmRemoved.vue';
    `,
  ]);

  assert.deepEqual([...exported].sort(), ['CmAdminShell', 'CmAppShell', 'CmTag']);
});

test('requires the exact component name in the guides', () => {
  const exported = new Set(['CmTag', 'CmAppShell', 'CmThemeSwitch']);
  const guides = [
    '`CmTag` is the outlined counterpart to Badge.',
    'CmAppShell is the widest frame.',
    'CmThemeSwitchOption describes one option.',
  ];

  assert.deepEqual(findUndocumentedComponents(exported, guides), ['CmThemeSwitch']);
});
