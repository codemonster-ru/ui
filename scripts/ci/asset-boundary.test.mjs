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
  scanSource,
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

test('a PHP require that escapes the package through dirname() is rejected', () => {
  // The M21 boundary attack: `dirname(__DIR__, 3)` from src/Components/ is
  // packages/, and the scanner read only `../`. Three levels from a file two
  // below the package root escapes; two levels does not.
  const escaping = analyzePhpIncludes({
    rootDir: '/repo',
    files: ['packages/razor/src/Components/ProgressBarComponent.php'],
    readFile: () => `<?php require_once dirname(__DIR__, 3) . '/core/src/utils/classes.ts';`,
  });
  assert.equal(escaping.length, 1);
  assert.match(escaping[0], /escapes the package/);

  const nested = analyzePhpIncludes({
    rootDir: '/repo',
    files: ['packages/razor/src/Components/ProgressBarComponent.php'],
    readFile: () => `<?php require dirname(dirname(dirname(__DIR__))) . '/core/x.php';`,
  });
  assert.equal(nested.length, 1);

  const inside = analyzePhpIncludes({
    rootDir: '/repo',
    files: ['packages/razor/src/Components/ProgressBarComponent.php'],
    readFile: () => `<?php require dirname(__DIR__, 2) . '/vendor/autoload.php';`,
  });
  assert.deepEqual(inside, []);
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

// ------------------------------------------------- M10: the icon ownership move

test('the Razor adapter may not read the Vue icons package for glyph geometry', () => {
  // The shape M10 could have taken. The icons package owns the geometry, but it
  // is a Vue package: reaching into it from the adapter would rebuild exactly
  // the coupling H3 was, one milestone after it was removed.
  for (const expression of [
    `readFileSync(resolve(root, 'packages/icons/dist/index.css'))`,
    `const source = 'packages/icons/src/lib/components/icon.vue';`,
    `readFileSync("packages/icons/src/lib/internal/solidIconData.json")`,
  ]) {
    const { violations } = analyze({ 'packages/razor/build-assets.mjs': expression });
    assert.equal(violations.length, 1, `expected a violation for ${expression}`);
    assert.match(violations[0], /packages\/icons/);
  }
});

test('a Razor PHP file may not reach the Vue icons package either', () => {
  const { violations } = analyze({
    'packages/razor/src/Support/IconRenderer.php': `<?php
      $path = dirname(__DIR__, 4) . '/packages/icons/dist/index.css';`,
  });

  assert.equal(violations.length, 1);
  assert.match(violations[0], /packages\/icons/);
});

test('the neutral icon registry and the shared icon layout are allowed edges', () => {
  // What the adapter actually reads after M10: a generated registry inside its
  // own package, and the canonical stylesheet in packages/styles. Neither is a
  // Vue package, which is the whole point of routing the icons through them.
  const { violations, edges } = analyze({
    'packages/razor/style-sources.mjs': `
      export const styleSources = [
        'packages/styles/src/components/icon.css',
        'packages/styles/src/components/input.css',
      ];`,
    'packages/razor/src/Support/IconRenderer.php': `<?php
      $path = dirname(__DIR__, 2) . '/resources/icons/icon-registry.json';`,
  });

  assert.deepEqual(violations, []);
  assert.deepEqual([...new Set(edges.map((edge) => edge.owner))], ['packages/styles']);
});

// --------------------------------------------- M10: the scanner's own blind spots
//
// The guard reads string literals, so how it decides what a string literal is
// decides what it can see at all. Both shapes below made it silently blind, and
// the first one was live: `packages/razor/style-sources.mjs` opens with a
// comment containing `the artifact's provenance`, and a forbidden path injected
// into the list five lines below it was not reported.

test('an apostrophe in a comment does not hide the literals after it', () => {
  const { violations } = analyze({
    'packages/razor/style-sources.mjs': `
      // Its own module because the artifact's provenance records exactly them.
      export const styleSources = [
        'packages/icons/dist/index.css',
      ];`,
  });

  assert.equal(violations.length, 1, 'the forbidden path after the apostrophe was not seen');
  assert.match(violations[0], /packages\/icons/);
});

test('prose in a comment is still not a dependency, apostrophes and all', () => {
  const { violations, edges } = analyze({
    'packages/razor/build-assets.mjs': `
      // This used to read packages/core/dist/tokens.css. It doesn't any more:
      // the theme package's generator owns those bytes now.
      const sources = ['packages/theme/.generated/theme/tokens.css'];`,
  });

  assert.deepEqual(violations, []);
  assert.deepEqual(
    edges.map((edge) => edge.path),
    ['packages/theme/.generated/theme/tokens.css'],
  );
});

test('a regular expression containing quotes does not desynchronise the scan', () => {
  // The exact construct in the Razor asset builder. Reading the quotes inside
  // it as string delimiters opened a string that never closed, and every
  // literal after it was lost.
  const { violations } = analyze({
    'packages/razor/build-assets.mjs': `
      const inlined = source.replace(/^@import\\s+['"](.+?)['"];\\s*$/gm, (statement) => statement);
      readFileSync('packages/core/src/styles/components.css');`,
  });

  assert.equal(violations.length, 1);
  assert.match(violations[0], /packages\/core/);
});

test('a division is not mistaken for a regular expression', () => {
  const { scan } = { scan: scanSource(`const ratio = width / height; const p = 'packages/styles/a.css';`) };

  assert.equal(scan.unterminated, false);
  assert.deepEqual(scan.literals, ['packages/styles/a.css']);
});

test('an unterminated string is reported rather than trusted', () => {
  const { violations } = analyze({
    'packages/razor/build-assets.mjs': `const broken = 'packages/theme/tokens.css;`,
  });

  assert.equal(violations.length, 1);
  assert.match(violations[0], /could not be scanned/);
});

test('a PHP attribute is code, and a PHP hash comment is not', () => {
  const scan = scanSource(
    `<?php
     # This once read packages/core/dist/tokens.css.
     #[DataProvider('packages/styles/src/components/icon.css')]
     final class T {}`,
    { hashComments: true },
  );

  assert.equal(scan.unterminated, false);
  assert.deepEqual(scan.literals, ['packages/styles/src/components/icon.css']);
});

test('a forbidden package named outside any literal is reported, not ignored', () => {
  // Belt and braces for a construction the walk does not model. Comments are
  // stripped first, so history in prose still costs nothing.
  const { violations } = analyze({
    'packages/razor/build-assets.mjs': `const parts = [packages/core/dist];`,
  });

  assert.equal(violations.length, 1);
  assert.match(violations[0], /outside any string literal/);
});

// An unterminated block comment used to consume the rest of the file and still
// report a clean scan. That is the exact failure this guard exists to prevent:
// everything after `/*` stopped being either a literal or code, so a forbidden
// path below it was reported by nothing. These pin the fail-closed behaviour
// and the absence of a false positive on ordinary comments.
test('an unterminated block comment is reported rather than trusted', () => {
  const { violations } = analyze({
    'packages/razor/build-assets.mjs': `
      const a = 1;
      /* this explanation never closes
      const styles = ['packages/icons/dist/icons.css'];`,
  });

  assert.equal(violations.length, 1);
  assert.match(violations[0], /could not be scanned/);
});

test('an unterminated block comment containing an apostrophe is reported', () => {
  // The M10 exploit shape: prose apostrophes are what desynchronised the walk
  // in the first place, so the two failures must not cancel into a clean pass.
  const { violations } = analyze({
    'packages/razor/build-assets.mjs': `
      /* the artifact's provenance, never closed
      const entry = 'packages/core/src/index.ts';`,
  });

  assert.equal(violations.length, 1);
  assert.match(violations[0], /could not be scanned/);
});

test('a closed block comment naming a forbidden package is not a violation', () => {
  // Accurate history in a comment is not a dependency, and flagging it would
  // push accurate comments out of the code.
  const { violations } = analyze({
    'packages/razor/build-assets.mjs': `
      /* This once read packages/icons/dist/icons.css and packages/core/dist. */
      readFileSync('packages/theme/dist/tokens.css');`,
  });

  assert.deepEqual(violations, []);
});

test('a forbidden literal after a closed block comment is still caught', () => {
  const { violations } = analyze({
    'packages/razor/build-assets.mjs': `
      /* harmless prose */
      readFileSync('packages/icons/dist/icons.css');`,
  });

  assert.equal(violations.length, 1);
  assert.match(violations[0], /packages\/icons/);
});

test('a block comment with apostrophes and quotes leaves the walk synchronised', () => {
  const scan = scanSource(
    `/* it's a comment with "quotes", an apostrophe and a /slash/ */
     const p = 'packages/styles/src/components/icon.css';`,
  );

  assert.equal(scan.unterminated, false);
  assert.deepEqual(scan.literals, ['packages/styles/src/components/icon.css']);
});
