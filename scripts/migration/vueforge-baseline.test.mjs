import assert from 'node:assert/strict';
import test from 'node:test';
import { discoverVueForgePackages, readVueForgeBaseline, validateVueForgeBaseline } from './vueforge-baseline.mjs';

test('matches the repository VueForge feature baseline', () => {
  assert.deepEqual(validateVueForgeBaseline(readVueForgeBaseline(), discoverVueForgePackages()), []);
});

test('reports package, version, directory, and export drift', () => {
  const baseline = {
    schemaVersion: 1,
    frozenAt: '2026-08-13',
    packages: [{ directory: 'core', name: '@codemonster-ru/vueforge-core', version: '2.4.0', exports: ['.'] }],
  };
  const actual = [
    { directory: 'renamed-core', name: '@codemonster-ru/vueforge-core', version: '2.5.0', exports: ['.', './new'] },
    { directory: 'new', name: '@codemonster-ru/vueforge-new', version: '1.0.0', exports: ['.'] },
  ];

  assert.deepEqual(validateVueForgeBaseline(baseline, actual), [
    '@codemonster-ru/vueforge-core moved from packages/core to packages/renamed-core.',
    '@codemonster-ru/vueforge-core version changed from 2.4.0 to 2.5.0.',
    '@codemonster-ru/vueforge-core public export subpaths changed from the frozen baseline.',
    'Unreviewed VueForge package was added: @codemonster-ru/vueforge-new.',
  ]);
});

test('reports malformed metadata and missing packages', () => {
  const baseline = {
    schemaVersion: 2,
    frozenAt: '13 August 2026',
    packages: [
      { directory: 'core', name: '@codemonster-ru/vueforge-core', version: '2.4.0', exports: ['.'] },
      { directory: 'other', name: '@codemonster-ru/vueforge-core', version: '2.4.0', exports: ['.'] },
    ],
  };

  assert.deepEqual(validateVueForgeBaseline(baseline, []), [
    'Baseline schemaVersion must be 1.',
    'Baseline frozenAt must use YYYY-MM-DD.',
    'Baseline contains duplicate package names: @codemonster-ru/vueforge-core.',
    'Frozen package is missing: @codemonster-ru/vueforge-core.',
    'Frozen package is missing: @codemonster-ru/vueforge-core.',
  ]);
});
