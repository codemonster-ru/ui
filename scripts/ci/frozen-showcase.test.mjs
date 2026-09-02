import assert from 'node:assert/strict';
import test from 'node:test';
import { affectsFrozenShowcase, findFrozenShowcaseChanges } from './frozen-showcase.mjs';

test('treats rendered showcase sources as frozen', () => {
  assert.equal(affectsFrozenShowcase('examples/vue/src/sections/core/CoreShowcase.vue'), true);
  assert.equal(affectsFrozenShowcase('examples/vue/src/LegacyShowcase.vue'), true);
  assert.equal(affectsFrozenShowcase('examples/vue/src/main.ts'), true);
});

test('leaves metadata, tests, and packaging alone', () => {
  // The catalog is read by the migration coverage check and imported by no Vue file.
  assert.equal(affectsFrozenShowcase('examples/vue/src/sections/core/component-catalog.json'), false);
  assert.equal(affectsFrozenShowcase('examples/vue/src/app-shell.test.ts'), false);
  assert.equal(affectsFrozenShowcase('examples/vue/package.json'), false);
  assert.equal(affectsFrozenShowcase('examples/vue/README.md'), false);
});

test('ignores everything outside the frozen example', () => {
  assert.equal(affectsFrozenShowcase('examples/ui-showcase/src/App.vue'), false);
  assert.equal(affectsFrozenShowcase('packages/vue/src/index.ts'), false);
});

test('reports the changes that would move the baseline', () => {
  assert.deepEqual(
    findFrozenShowcaseChanges([
      'packages/vue/src/index.ts',
      'examples/vue/src/sections/core/CoreShowcase.vue',
      'examples/vue/src/sections/core/component-catalog.json',
      'examples/vue/src/main.ts',
    ]),
    ['examples/vue/src/main.ts', 'examples/vue/src/sections/core/CoreShowcase.vue'],
  );
});
