import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const script = resolve('scripts/migrate-to-codemonster-ui.mjs');

function run(args) {
  return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
}

test('checks and writes approved named component and CSS renames', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'codemonster-codemod-'));
  const vueFile = resolve(root, 'Example.vue');
  const cssFile = resolve(root, 'styles.css');
  const vueSource = `<template><VfButton /><VfConfirmDialog /></template>
<script setup lang="ts">
import { ref } from 'vue';
import { VfButton, VfConfirmDialog, useTheme } from '@codemonster-ru/vueforge-core';
const state = ref(false);
const component = VfButton;
const untouched = 'VfButton';
</script>
`;
  try {
    writeFileSync(vueFile, vueSource);
    writeFileSync(cssFile, `@import '@codemonster-ru/vueforge-core/button.css';\n`);

    const check = run([root]);
    assert.equal(check.status, 1);
    assert.match(check.stdout, /Would update 2 file/);
    assert.equal(readFileSync(vueFile, 'utf8'), vueSource);

    const write = run(['--write', root]);
    assert.equal(write.status, 0);
    const migrated = readFileSync(vueFile, 'utf8');
    assert.match(migrated, /import \{ VfConfirmDialog, useTheme \} from '@codemonster-ru\/vueforge-core';/u);
    assert.match(migrated, /import \{ CmButton \} from '@codemonster-ru\/ui-vue';/u);
    assert.match(migrated, /import \{ ref \} from 'vue';/u);
    assert.match(migrated, /const state = ref\(false\);/u);
    assert.match(migrated, /<CmButton \/>/u);
    assert.match(migrated, /<VfConfirmDialog \/>/u);
    assert.match(migrated, /const component = CmButton;/u);
    assert.match(migrated, /const untouched = 'VfButton';/u);
    assert.equal(readFileSync(cssFile, 'utf8'), `@import '@codemonster-ru/ui-css/button.css';\n`);

    const repeat = run([root]);
    assert.equal(repeat.status, 0);
    assert.match(repeat.stdout, /Would update 0 file/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('preserves aliases and leaves default and retained imports unchanged', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'codemonster-codemod-alias-'));
  const file = resolve(root, 'example.ts');
  try {
    writeFileSync(
      file,
      `import { VfCard as ProductCard } from '@codemonster-ru/vueforge-core/card';\n` +
        `import VfSkeleton from '@codemonster-ru/vueforge-core/skeleton';\n` +
        `import { VfCodeBlock } from '@codemonster-ru/vueforge-codeblock/view';\n` +
        `const view = ProductCard;\n`,
    );
    assert.equal(run(['--write', file]).status, 0);
    const migrated = readFileSync(file, 'utf8');
    assert.match(migrated, /import \{ CmCard as ProductCard \} from '@codemonster-ru\/ui-vue';/u);
    assert.match(migrated, /import VfSkeleton from '@codemonster-ru\/vueforge-core\/skeleton';/u);
    assert.match(migrated, /vueforge-codeblock\/view/u);
    assert.match(migrated, /const view = ProductCard;/u);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
