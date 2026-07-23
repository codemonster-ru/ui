import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const scriptPath = resolve(import.meta.dirname, 'migrate-to-v2.mjs');

function runMigration(arguments_) {
  return spawnSync(process.execPath, [scriptPath, ...arguments_], {
    encoding: 'utf8',
  });
}

test('checks and writes deterministic VueForge 2 renames', () => {
  const temporaryDirectory = mkdtempSync(resolve(tmpdir(), 'vueforge-v2-migration-'));
  const fixturePath = resolve(temporaryDirectory, 'fixture.vue');
  const source = `<section data-vf-theme="dark" data-theme-owner="application">
  <span style="color: var(--vf-color-text-primary, var(--vf-color-text))"></span>
  <span style="background: var(--vf-color-bg)"></span>
  <span style="background: var(--vf-color-surface-muted)"></span>
  <span style="color: var(--vf-color-primary-contrast)"></span>
  <span style="color: var(--vf-color-warn)"></span>
</section>
<script setup lang="ts">
import type { VueforgePlaygroundVirtualEntryConfig } from '@codemonster-ru/vueforge-playground-vite-plugin';
</script>
`;

  try {
    writeFileSync(fixturePath, source);

    const check = runMigration([fixturePath]);
    assert.equal(check.status, 1);
    assert.match(check.stdout, /Would update 1 file/);
    assert.equal(readFileSync(fixturePath, 'utf8'), source);

    const write = runMigration(['--write', fixturePath]);
    assert.equal(write.status, 0);
    assert.match(write.stdout, /Updated 1 file/);

    const migrated = readFileSync(fixturePath, 'utf8');
    assert.match(migrated, /data-vf-theme="dark"/);
    assert.match(migrated, /data-theme-owner="application"/);
    assert.match(migrated, /var\(--vf-color-text-primary\)/);
    assert.match(migrated, /var\(--vf-color-background-canvas\)/);
    assert.match(migrated, /var\(--vf-color-background-surface-subtle\)/);
    assert.match(migrated, /var\(--vf-color-interactive-primary-foreground\)/);
    assert.match(migrated, /var\(--vf-color-status-warning-solid-background\)/);
    assert.doesNotMatch(migrated, /color-background-surface-muted|color-interactive-primary-background-contrast/);
    assert.match(migrated, /VueForgePlaygroundVirtualEntryConfig/);

    const idempotenceCheck = runMigration([fixturePath]);
    assert.equal(idempotenceCheck.status, 0);
    assert.match(idempotenceCheck.stdout, /Would update 0 file/);
  } finally {
    rmSync(temporaryDirectory, { force: true, recursive: true });
  }
});

test('reports migrations that require semantic context', () => {
  const temporaryDirectory = mkdtempSync(resolve(tmpdir(), 'vueforge-v2-migration-manual-'));
  const fixturePath = resolve(temporaryDirectory, 'fixture.ts');

  try {
    writeFileSync(
      fixturePath,
      `import { SHIKI_LIGHT_THEME } from '@codemonster-ru/vueforge-codeblock';
const legacyThemeAttribute = 'data-theme';
const appThemeAttribute = 'data-theme-owner';
const preset = { colorWarn: 'gold', tableOfContentsTitleColor: 'gray' };
const currentShadow = 'var(--vf-shadow-md)';
const removedPlaygroundHook = 'var(--vf-playground-run-bg)';
const removedIconsExport = dualStyleCoreIconNames;
const removedIconProp = '<VueIconify style="solid" />';
`,
    );

    const result = runMigration(['--write', fixturePath]);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /legacy data-theme attribute/);
    assert.match(result.stderr, /legacy theme token fields/);
    assert.match(result.stderr, /legacy Shiki theme constants/);
    assert.match(result.stderr, /CodeBlock package-root imports/);
    assert.match(result.stderr, /removed Table of Contents title-color hook/);
    assert.match(result.stderr, /removed Playground styling hooks/);
    assert.match(result.stderr, /removed dual-style Icons export/);
    assert.match(result.stderr, /removed VueIconify solid style prop/);
    assert.doesNotMatch(result.stderr, /removed generic shadow token/);
    const checkedSource = readFileSync(fixturePath, 'utf8');
    assert.match(checkedSource, /data-theme'/);
    assert.match(checkedSource, /data-theme-owner/);
    assert.match(checkedSource, /colorWarn/);
  } finally {
    rmSync(temporaryDirectory, { force: true, recursive: true });
  }
});
