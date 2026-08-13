import assert from 'node:assert/strict';
import test from 'node:test';
import {
  codeMonsterUiComposerPackage,
  codeMonsterUiNodeEngine,
  codeMonsterUiNpmPackages,
} from './code-monster-ui-package-catalog.mjs';
import {
  validateCodeMonsterUiComposerManifest,
  validateCodeMonsterUiNpmManifest,
  validateCodeMonsterUiPackageCatalog,
} from './code-monster-ui-package-metadata.mjs';

const tokensContract = codeMonsterUiNpmPackages.find(({ directory }) => directory === 'tokens');
const vueContract = codeMonsterUiNpmPackages.find(({ directory }) => directory === 'vue');

function createNpmManifest(packageContract, overrides = {}) {
  return {
    name: packageContract.name,
    version: '0.1.0',
    description: 'CodeMonster UI test package.',
    type: 'module',
    license: 'MIT',
    engines: { node: codeMonsterUiNodeEngine },
    exports: { '.': './dist/index.js' },
    files: ['dist'],
    scripts: {
      build: 'example',
      check: 'example',
      format: 'example',
      lint: 'example',
      prepack: 'example',
      test: 'example',
      typecheck: 'example',
    },
    publishConfig: { access: 'public' },
    peerDependencies: { ...packageContract.frameworkPeers },
    ...overrides,
  };
}

test('accepts the approved package catalog', () => {
  assert.deepEqual(validateCodeMonsterUiPackageCatalog(), []);
});

test('accepts a framework-independent npm package manifest', () => {
  assert.deepEqual(validateCodeMonsterUiNpmManifest(tokensContract, createNpmManifest(tokensContract)), []);
});

test('accepts only the matching adapter framework peer', () => {
  assert.deepEqual(validateCodeMonsterUiNpmManifest(vueContract, createNpmManifest(vueContract)), []);

  const errors = validateCodeMonsterUiNpmManifest(
    tokensContract,
    createNpmManifest(tokensContract, {
      dependencies: { vue: '^3.5.0' },
    }),
  );
  assert.ok(errors.some((message) => message.includes('must not declare vue in dependencies')));
});

test('reports incomplete npm publication metadata', () => {
  const manifest = createNpmManifest(tokensContract);
  delete manifest.exports;
  delete manifest.scripts.test;

  assert.deepEqual(validateCodeMonsterUiNpmManifest(tokensContract, manifest), [
    '@codemonster-ru/ui-tokens must declare explicit package exports.',
    '@codemonster-ru/ui-tokens scripts.test is required.',
  ]);
});

test('accepts the approved Composer package metadata', () => {
  const manifest = {
    name: codeMonsterUiComposerPackage.name,
    description: 'CodeMonster UI Annabel adapter.',
    type: 'library',
    license: 'MIT',
    require: {
      php: codeMonsterUiComposerPackage.php,
      'codemonster-ru/razor': codeMonsterUiComposerPackage.razor,
    },
    autoload: { 'psr-4': { 'Codemonster\\Ui\\': 'src/' } },
    scripts: { analyse: 'example', check: 'example', test: 'example' },
  };

  assert.deepEqual(validateCodeMonsterUiComposerManifest(codeMonsterUiComposerPackage, manifest), []);
});
