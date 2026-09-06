// Negative fixture for the neutral asset boundary.
//
// H3 escaped the dependency guard because the coupling was a string handed to
// the filesystem rather than an import specifier. Every shape below is one the
// guard has to catch, and the last group is the prose it must not catch.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  analyzeAssetBoundary,
  analyzePhpIncludes,
  extractJsonRepositoryPaths,
  extractRepositoryPaths,
} from './asset-boundary.mjs';

function analyze(fileContents) {
  return analyzeAssetBoundary({
    rootDir: '/repo',
    files: Object.keys(fileContents),
    readFile: (file) => fileContents[file],
  });
}

test('the exact H3 shape is rejected: a Vue adapter path in a source array', () => {
  const { violations } = analyze({
    'packages/razor/build-assets.mjs': `
      const styleSources = [
        'packages/core/.generated/theme/tokens.css',
        'packages/styles/src/components/input.css',
      ];`,
  });

  assert.equal(violations.length, 1);
  assert.match(violations[0], /packages\/core/);
  assert.match(violations[0], /may only read/);
});

test('a Vue adapter path handed to the filesystem is rejected however it is spelled', () => {
  for (const expression of [
    `readFileSync(resolve(root, 'packages/core/src/styles/components/base.css'))`,
    `readFileSync("packages/layouts/src/styles.css")`,
    'const p = `packages/core/dist/tokens.css`;',
    `cpSync(resolve(root, 'examples/playground/dist/assets/index.css'), target)`,
  ]) {
    const { violations } = analyze({ 'packages/razor/build-assets.mjs': expression });
    assert.equal(violations.length, 1, `expected a violation for ${expression}`);
  }
});

test('a Vue adapter path reached from a Razor PHP file is rejected', () => {
  const { violations } = analyze({
    'packages/razor/src/Support/IconRenderer.php': `<?php
      $path = dirname(__DIR__, 4) . '/packages/core/.generated/theme/tokens.css';`,
  });

  assert.equal(violations.length, 1);
  assert.match(violations[0], /packages\/core/);
});

test('neutral sources are recorded as edges, not violations', () => {
  const { violations, edges } = analyze({
    'packages/razor/build-assets.mjs': `
      const styleSources = [
        'packages/theme/.generated/theme/tokens.css',
        'packages/styles/src/foundation/base.css',
        'packages/shared-core/src/index.ts',
      ];`,
  });

  assert.deepEqual(violations, []);
  assert.deepEqual(
    edges.map((edge) => edge.owner),
    ['packages/theme', 'packages/styles', 'packages/shared-core'],
  );
});

test('a package may name its own files', () => {
  const { violations } = analyze({
    'packages/razor/build-assets.mjs': `writeFileSync('packages/razor/dist/vueforge-razor.css', css);`,
  });

  assert.deepEqual(violations, []);
});

// -------------------------------------------------------------------- Composer

test('a Composer dependency on a Vue adapter package is rejected', () => {
  const { violations } = analyze({
    'packages/razor/composer.json': JSON.stringify({
      name: 'codemonster-ru/vueforge-razor',
      require: { php: '>=8.2', 'codemonster-ru/vueforge-core': '^1.0' },
    }),
  });

  assert.equal(violations.length, 1);
  assert.match(violations[0], /composer require declares forbidden dependency/);
});

test('a distributable package may not resolve dependencies out of the working tree', () => {
  const { violations } = analyze({
    'packages/razor/composer.json': JSON.stringify({
      name: 'codemonster-ru/vueforge-razor',
      repositories: [{ type: 'path', url: '../core' }],
      require: { php: '>=8.2' },
    }),
  });

  assert.equal(violations.length, 1);
  assert.match(violations[0], /path repository/);
});

test('a malformed Composer manifest fails rather than being skipped', () => {
  const { violations } = analyze({ 'packages/razor/composer.json': '{ not json' });

  assert.equal(violations.length, 1);
  assert.match(violations[0], /not valid JSON/);
});

// ------------------------------------------------------------------ PHP escape

test('a PHP require that escapes the package is rejected', () => {
  const violations = analyzePhpIncludes({
    rootDir: '/repo',
    files: ['packages/razor/src/Bootstrap.php'],
    readFile: () => `<?php require __DIR__ . '/../../core/src/bootstrap.php';`,
  });

  assert.equal(violations.length, 1);
  assert.match(violations[0], /escapes the package/);
});

test('a PHP require inside the package is accepted', () => {
  const violations = analyzePhpIncludes({
    rootDir: '/repo',
    files: ['packages/razor/src/Bootstrap.php'],
    readFile: () => `<?php require __DIR__ . '/Support/Html.php';`,
  });

  assert.deepEqual(violations, []);
});

// ----------------------------------------------------------------------- prose

test('a comment explaining what the package used to read is not a dependency', () => {
  const { violations } = analyze({
    'packages/razor/build-assets.mjs': `
      // Before M09 these came from packages/core, which meant the Razor adapter
      // could not build without the Vue adapter.
      const styleSources = ['packages/theme/.generated/theme/tokens.css'];`,
  });

  assert.deepEqual(violations, []);
});

test('generated provenance in a $comment is not a dependency, but a real value is', () => {
  assert.deepEqual(extractJsonRepositoryPaths({ $comment: 'Generated from packages/icons by the generator.' }), []);
  assert.deepEqual(extractJsonRepositoryPaths({ source: 'packages/core/dist/index.css' }), [
    'packages/core/dist/index.css',
  ]);
});

test('paths are read out of string literals, not out of surrounding text', () => {
  assert.deepEqual(extractRepositoryPaths(`// see packages/core/src/x.css`), []);
  assert.deepEqual(extractRepositoryPaths(`read('packages/core/src/x.css')`), ['packages/core/src/x.css']);
});
