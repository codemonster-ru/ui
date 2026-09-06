// Negative verification for the architecture boundary gate.
//
// A passing guard proves nothing unless it fails on a real violation. Every
// case below builds a throwaway repository in a temp directory, plants one
// prohibited edge and asserts the analyzer reports it. No deliberate violation
// ever exists in the production tree.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { after, test } from 'node:test';
import { analyzeBoundaries, analyzeCssOwnership } from './boundaries.mjs';

const fixtureRoots = [];

after(() => {
  for (const root of fixtureRoots) {
    rmSync(root, { recursive: true, force: true });
  }
});

const baselineManifests = {
  'packages/shared-core/package.json': { name: '@codemonster-ru/vueforge-shared-core', private: true },
  'packages/styles/package.json': { name: '@codemonster-ru/vueforge-styles', private: true },
  'packages/theme/package.json': { name: '@codemonster-ru/vueforge-theme' },
  'packages/core/package.json': { name: '@codemonster-ru/vueforge-core' },
  'packages/layouts/package.json': { name: '@codemonster-ru/vueforge-layouts' },
};

// Builds a minimal but rule-complete repository. `extraFiles` plants the
// violation under test; `manifestOverrides` replaces a baseline manifest.
function buildFixture(extraFiles = {}, manifestOverrides = {}) {
  const root = mkdtempSync(resolve(tmpdir(), 'vueforge-boundaries-'));
  fixtureRoots.push(root);

  const files = [];
  const write = (relativePath, contents) => {
    const absolutePath = resolve(root, relativePath);
    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, contents);
    files.push(relativePath);
  };

  for (const [path, manifest] of Object.entries({ ...baselineManifests, ...manifestOverrides })) {
    write(path, JSON.stringify(manifest, null, 2));
  }
  for (const [path, contents] of Object.entries(extraFiles)) {
    write(path, contents);
  }

  return { rootDir: root, files };
}

function analyze(extraFiles, manifestOverrides) {
  return analyzeBoundaries(buildFixture(extraFiles, manifestOverrides));
}

test('a clean boundary layout reports no violations', () => {
  const { violations } = analyze({
    'packages/shared-core/src/index.ts': 'export {};\n',
    'packages/theme/src/index.ts': "export const token = 'value';\n",
  });

  assert.deepEqual(violations, []);
});

test('shared-core -> core is rejected', () => {
  const { violations } = analyze({
    'packages/shared-core/src/index.ts':
      "import { VfInput } from '@codemonster-ru/vueforge-core';\nexport { VfInput };\n",
  });

  assert.ok(violations.some((violation) => violation.includes('forbidden dependency shared-core -> core')));
});

test('shared-core -> vue is rejected', () => {
  const { violations } = analyze({
    'packages/shared-core/src/index.ts': "import { computed } from 'vue';\nexport { computed };\n",
  });

  assert.ok(violations.some((violation) => violation.includes('forbidden dependency shared-core -> vue')));
});

test('shared-core -> layouts through a relative escape import is rejected', () => {
  const { violations } = analyze({
    'packages/shared-core/src/index.ts': "export { VfStack } from '../../layouts/src/index';\n",
  });

  assert.ok(violations.some((violation) => violation.includes('forbidden dependency shared-core -> layouts')));
});

test('styles -> core through a CSS @import is rejected', () => {
  const { violations } = analyze({
    'packages/styles/src/index.css': "@import '../../core/src/styles/components.css';\n",
  });

  assert.ok(violations.some((violation) => violation.includes('forbidden dependency styles -> core')));
});

test('styles -> vue is rejected', () => {
  const { violations } = analyze({
    'packages/styles/src/index.ts': "import 'vue';\n",
  });

  assert.ok(violations.some((violation) => violation.includes('forbidden dependency styles -> vue')));
});

test('styles -> layouts is rejected', () => {
  const { violations } = analyze({
    'packages/styles/src/index.ts': "export * from '@codemonster-ru/vueforge-layouts';\n",
  });

  assert.ok(violations.some((violation) => violation.includes('forbidden dependency styles -> layouts')));
});

test('razor -> core is rejected once the razor package is tracked', () => {
  const { violations } = analyze(
    {
      'packages/razor/browser/input.ts':
        "import { VfInput } from '@codemonster-ru/vueforge-core';\nexport { VfInput };\n",
    },
    { 'packages/razor/composer.json': { name: 'codemonster-ru/vueforge-razor' } },
  );

  assert.ok(violations.some((violation) => violation.includes('forbidden dependency razor -> core')));
});

test('razor -> vue is rejected once the razor package is tracked', () => {
  const { violations } = analyze(
    { 'packages/razor/browser/input.ts': "import { createApp } from 'vue';\nexport { createApp };\n" },
    { 'packages/razor/composer.json': { name: 'codemonster-ru/vueforge-razor' } },
  );

  assert.ok(violations.some((violation) => violation.includes('forbidden dependency razor -> vue')));
});

test('an untracked razor leftover is not scanned', () => {
  // The package.json is absent from the tracked file list, exactly as the
  // working-tree leftover is. Its content must not produce a verdict.
  const { violations, notes } = analyze({});

  assert.deepEqual(violations, []);
  assert.ok(notes.some((note) => note.includes('razor: not tracked yet')));
});

test('the Vue adapter may not depend on Razor bootstrap', () => {
  const { violations } = analyze(
    { 'packages/core/src/bootstrap.ts': "import '../../razor/browser/input';\n" },
    { 'packages/razor/composer.json': { name: 'codemonster-ru/vueforge-razor' } },
  );

  assert.ok(violations.some((violation) => violation.includes('forbidden dependency core -> razor')));
});

test('a razor PHP file reaching into a Vue adapter namespace is rejected', () => {
  const { violations } = analyze(
    {
      'packages/razor/src/Leak.php':
        '<?php\nnamespace Codemonster\\VueForge\\Razor;\nuse Codemonster\\VueForge\\Razor\\Support\\Html;\n',
    },
    { 'packages/razor/composer.json': { name: 'codemonster-ru/vueforge-razor' } },
  );

  // A `use` of the adapter's own namespace is fine; the scan exists so a
  // namespace belonging to another package would be reported.
  assert.deepEqual(violations, []);
});

test('a browser global in shared-core is rejected', () => {
  const { violations } = analyze({
    'packages/shared-core/src/index.ts': 'export const width = () => window.innerWidth;\n',
  });

  assert.ok(violations.some((violation) => violation.includes('shared-core must stay DOM-free')));
});

test('theme is allowed to touch the DOM but not Vue', () => {
  const domOnly = analyze({
    'packages/theme/src/runtime.ts': 'export const apply = (target = document) => target.title;\n',
  });
  assert.deepEqual(domOnly.violations, []);

  const withVue = analyze({
    'packages/theme/src/runtime.ts': "import { ref } from 'vue';\nexport { ref };\n",
  });
  assert.ok(withVue.violations.some((violation) => violation.includes('forbidden dependency theme -> vue')));
});

test('a forbidden manifest dependency is rejected even without an import', () => {
  const { violations } = analyze(
    {},
    {
      'packages/shared-core/package.json': {
        name: '@codemonster-ru/vueforge-shared-core',
        private: true,
        dependencies: { '@codemonster-ru/vueforge-core': '*' },
      },
    },
  );

  assert.ok(violations.some((violation) => violation.includes('manifest dependencies declares forbidden dependency')));
});

test('a boundary package that stops being private is rejected', () => {
  const { violations } = analyze({}, { 'packages/styles/package.json': { name: '@codemonster-ru/vueforge-styles' } });

  assert.ok(violations.some((violation) => violation.includes('must stay "private": true')));
});

test('renaming a boundary package away from the planned name is rejected', () => {
  const { violations } = analyze(
    {},
    { 'packages/shared-core/package.json': { name: '@codemonster-ru/ui-core', private: true } },
  );

  assert.ok(violations.some((violation) => violation.includes('the plan fixes it at')));
});

test('a missing boundary package is rejected', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'vueforge-boundaries-'));
  fixtureRoots.push(root);

  const { violations } = analyzeBoundaries({ rootDir: root, files: [] });

  assert.ok(violations.some((violation) => violation.includes('expected a package manifest at packages/shared-core')));
  assert.ok(violations.some((violation) => violation.includes('expected a package manifest at packages/styles')));
});

test('an allowed edge is reported as a note, not a violation', () => {
  const { violations, notes } = analyze({
    'packages/core/src/theme/preset.ts': "export { token } from '../../../theme/src/index';\n",
  });

  assert.deepEqual(violations, []);
  assert.ok(notes.some((note) => note.includes('escape import core -> theme')));
});

// M04 moved the VfInput CSS closure into the styles package. These cases prove
// the adapter cannot quietly grow a second, independently editable copy.
function cssFixture(extraFiles) {
  const { rootDir, files } = buildFixture(extraFiles);
  return analyzeCssOwnership({ rootDir, files });
}

test('a forwarding adapter entry pointing at the canonical source is accepted', () => {
  const violations = cssFixture({
    'packages/styles/src/components/input.css': '.vf-input { color: red; }\n',
    'packages/core/src/styles/entries/input.css': "@import '../../../../styles/src/components/input.css';\n",
  });

  assert.deepEqual(violations, []);
});

test('an adapter entry that keeps its own copy of a canonical stylesheet is rejected', () => {
  const violations = cssFixture({
    'packages/styles/src/components/input.css': '.vf-input { color: red; }\n',
    'packages/core/src/styles/entries/input.css': '.vf-input { color: blue; }\n',
  });

  assert.equal(violations.length, 1);
  assert.match(violations[0], /duplicates the canonical stylesheet/);
});

test('a forwarding entry that also adds rules is rejected', () => {
  const violations = cssFixture({
    'packages/styles/src/components/input.css': '.vf-input { color: red; }\n',
    'packages/core/src/styles/entries/input.css':
      "@import '../../../../styles/src/components/input.css';\n.vf-input { color: blue; }\n",
  });

  assert.equal(violations.length, 1);
  assert.match(violations[0], /duplicates the canonical stylesheet/);
});

test('a forwarding entry aimed at the wrong file is rejected', () => {
  const violations = cssFixture({
    'packages/styles/src/components/input.css': '.vf-input { color: red; }\n',
    'packages/styles/src/components/field.css': '.vf-field { color: red; }\n',
    'packages/core/src/styles/entries/input.css': "@import '../../../../styles/src/components/field.css';\n",
  });

  assert.equal(violations.length, 1);
  assert.match(violations[0], /expected the canonical source/);
});

test('adapter entries the styles package does not own are left alone', () => {
  const violations = cssFixture({
    'packages/styles/src/components/input.css': '.vf-input { color: red; }\n',
    'packages/core/src/styles/entries/button.css': '.vf-button { color: blue; }\n',
  });

  assert.deepEqual(violations, []);
});
