import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { discoverCodeMonsterUiWorkspaces } from './code-monster-ui-workspaces.mjs';

function createPackages(manifests) {
  const packagesDirectory = mkdtempSync(join(tmpdir(), 'codemonster-ui-workspaces-'));

  for (const [directory, manifest] of Object.entries(manifests)) {
    const workspaceDirectory = join(packagesDirectory, directory);
    mkdirSync(workspaceDirectory);
    writeFileSync(join(workspaceDirectory, 'package.json'), JSON.stringify(manifest));
  }

  return packagesDirectory;
}

test('discovers CodeMonster UI workspaces in release order', (context) => {
  const packagesDirectory = createPackages({
    vue: { name: '@codemonster-ru/ui-vue' },
    legacy: { name: '@codemonster-ru/vueforge-core' },
    css: { name: '@codemonster-ru/ui-css' },
    tokens: { name: '@codemonster-ru/ui-tokens' },
  });
  context.after(() => rmSync(packagesDirectory, { recursive: true }));

  assert.deepEqual(
    discoverCodeMonsterUiWorkspaces(packagesDirectory).map(({ name }) => name),
    ['@codemonster-ru/ui-tokens', '@codemonster-ru/ui-css', '@codemonster-ru/ui-vue'],
  );
});

test('rejects a registered package in the wrong directory', (context) => {
  const packagesDirectory = createPackages({ wrong: { name: '@codemonster-ru/ui-tokens' } });
  context.after(() => rmSync(packagesDirectory, { recursive: true }));

  assert.throws(
    () => discoverCodeMonsterUiWorkspaces(packagesDirectory),
    /must use packages\/tokens, found packages\/wrong/,
  );
});

test('rejects an unregistered CodeMonster UI workspace', (context) => {
  const packagesDirectory = createPackages({ future: { name: '@codemonster-ru/ui-future' } });
  context.after(() => rmSync(packagesDirectory, { recursive: true }));

  assert.throws(
    () => discoverCodeMonsterUiWorkspaces(packagesDirectory),
    /is not registered in the CodeMonster UI package catalog/,
  );
});
