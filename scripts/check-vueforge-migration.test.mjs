import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { analyzeVueForgeSource, checkVueForgeMigration } from './check-vueforge-migration.mjs';
import { readVueForgeMapping } from './migration/vueforge-mapping.mjs';

const mapping = readVueForgeMapping();

test('reports package, component, selector, variable, and theme references', () => {
  const findings = analyzeVueForgeSource(
    `import { VfButton } from '@codemonster-ru/vueforge-core/button';\n` +
      `<VfConfirmDialog class="vf-dialog" data-vf-theme="dark" />\n` +
      `.demo { color: var(--vf-color-text-primary); }`,
    mapping,
  );

  assert.deepEqual(
    findings.map(({ kind, value, action, targets }) => ({ kind, value, action, targets })),
    [
      { kind: 'component', value: 'VfButton', action: 'replace', targets: ['CmButton'] },
      {
        kind: 'package',
        value: '@codemonster-ru/vueforge-core/button',
        action: 'partial',
        targets: ['@codemonster-ru/ui-vue', '@codemonster-ru/ui-css', '@codemonster-ru/ui-runtime'],
      },
      { kind: 'component', value: 'VfConfirmDialog', action: 'compose', targets: ['CmDialog', 'CmButton'] },
      { kind: 'css-class', value: '.vf-dialog', action: 'manual', targets: [] },
      { kind: 'theme-attribute', value: 'data-vf-theme', action: 'manual', targets: [] },
      { kind: 'css-variable', value: '--vf-color-text-primary', action: 'manual', targets: [] },
    ],
  );
});

test('walks supported source files and ignores dependency and build trees', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'vueforge-migration-check-'));
  try {
    mkdirSync(resolve(root, 'src'));
    mkdirSync(resolve(root, 'node_modules'));
    mkdirSync(resolve(root, 'dist'));
    writeFileSync(resolve(root, 'src/App.vue'), '<VfCard />');
    writeFileSync(resolve(root, 'src/notes.txt'), 'VfButton');
    writeFileSync(resolve(root, 'node_modules/library.js'), 'VfButton');
    writeFileSync(resolve(root, 'dist/index.js'), 'VfButton');

    assert.deepEqual(checkVueForgeMigration([root], { root, mapping }), [
      {
        file: 'src/App.vue',
        line: 1,
        column: 2,
        kind: 'component',
        value: 'VfCard',
        action: 'replace',
        targets: ['CmCard'],
      },
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('rejects write mode without changing the target', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'vueforge-migration-read-only-'));
  const target = resolve(root, 'App.vue');
  const source = '<VfButton />\n';
  try {
    writeFileSync(target, source);
    const result = spawnSync(process.execPath, [resolve('scripts/check-vueforge-migration.mjs'), '--write', target], {
      encoding: 'utf8',
    });
    assert.equal(result.status, 2);
    assert.match(result.stderr, /checker is read-only/u);
    assert.equal(readFileSync(target, 'utf8'), source);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
