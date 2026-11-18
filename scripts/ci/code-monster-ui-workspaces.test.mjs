import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { discoverCodeMonsterUiWorkspaces, selectWorkspaceChecks } from './code-monster-ui-workspaces.mjs';

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

const packages = [
  { name: 'tokens', path: 'packages/tokens', dependencies: [] },
  { name: 'runtime', path: 'packages/runtime', dependencies: [] },
  { name: 'icons', path: 'packages/icons', dependencies: [] },
  { name: 'utilities', path: 'packages/utilities', dependencies: ['tokens'] },
  { name: 'vue', path: 'packages/vue', dependencies: ['icons', 'runtime', 'tokens'] },
  { name: 'layouts', path: 'packages/layouts', dependencies: ['vue'] },
];
const examples = [
  { name: 'showcase', path: 'examples/ui-showcase', private: true, dependencies: ['layouts', 'utilities'] },
  { name: 'vanilla', path: 'examples/vanilla', private: true, dependencies: ['runtime'] },
];
const names = (workspaces) => workspaces.map(({ name }) => name);

test('tests changed packages and their dependants while only building prerequisites', () => {
  const plan = selectWorkspaceChecks(packages, examples, ['packages/runtime/src/index.ts']);
  assert.equal(plan.full, false);
  assert.deepEqual(names(plan.tests), ['runtime', 'vue', 'layouts']);
  assert.deepEqual(names(plan.builds), ['tokens', 'runtime', 'icons', 'vue', 'layouts']);
});

test('adds component fixture prerequisites only when browser smoke needs them', () => {
  const utilities = selectWorkspaceChecks(packages, examples, ['packages/utilities/src/index.css'], true);
  assert.equal(utilities.browser, false);
  assert.deepEqual(names(utilities.builds), ['tokens', 'utilities']);

  const vanilla = selectWorkspaceChecks(packages, examples, ['examples/vanilla/index.html'], true);
  assert.equal(vanilla.browser, true);
  assert.deepEqual(names(vanilla.tests), ['vanilla']);
  assert.deepEqual(names(vanilla.builds), ['tokens', 'runtime', 'icons', 'vue', 'layouts', 'vanilla']);
});

test('checks the full graph for shared contracts or configuration and skips builds for docs', () => {
  for (const path of ['tsconfig.base.json', 'package-lock.json', 'contracts/button/manifest.json']) {
    const plan = selectWorkspaceChecks(packages, examples, [path]);
    assert.equal(plan.full, true);
    assert.deepEqual(plan.tests, [...packages, ...examples]);
  }
  const docs = selectWorkspaceChecks(packages, examples, ['README.md', 'docs/vanilla.md'], true);
  assert.equal(docs.browser, false);
  assert.deepEqual(docs.builds, []);

  const shared = selectWorkspaceChecks(packages, examples, ['examples/shared/showcase.css']);
  assert.equal(shared.full, false);
  assert.deepEqual(shared.tests, examples);
});
