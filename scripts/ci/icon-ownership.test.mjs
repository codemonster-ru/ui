// M10: icons have one owner, and migrating a component needs no icon work.
//
// Before M10 the Razor adapter was fed a three-glyph blob extracted for VfInput
// by a generator named after it, and the icon layout existed twice - once as a
// <style scoped> block in the Vue icon component, once as inline style
// attributes injected into the Razor markup because a scoped selector cannot
// match Razor's DOM. Migrating a second component would have meant extracting
// more glyphs by hand and carrying the layout a third time.
//
// These assertions are what would fail if either half regressed. They read
// files rather than importing the generator: the generator imports the Vue icon
// package, and a structural check should not need a Vue runtime to run.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { GENERATED_ICON_REGISTRIES, unauthorizedGeometryBlobs } from './icon-ownership.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (path) => readFileSync(resolve(repositoryRoot, path), 'utf8');

/** The two copies the generator writes: the repository one and the shipped one. */
const registryPaths = [
  'packages/shared-core/src/icons/icon-registry.json',
  'packages/razor/resources/icons/icon-registry.json',
];

test('the neutral registry is one artifact, copied byte for byte', () => {
  const [canonical, distributed] = registryPaths.map(read);

  assert.equal(
    canonical,
    distributed,
    'The shipped registry differs from the canonical one; run npm run icons:registry -- --write.',
  );
});

test('the registry covers the whole icon system, not one component closure', () => {
  const registry = JSON.parse(read(registryPaths[0])).icons;
  const names = Object.keys(registry);

  // The exact count is not pinned - the icons package may add glyphs - but a
  // registry that shrank back to a handful means the per-component blob is back.
  assert.ok(names.length > 100, `the registry holds ${names.length} glyphs`);

  // The three VfInput needed, and glyphs no migrated component has ever needed.
  // The second group is the actual claim: the next component's icons are
  // already here, so migrating it requires no extraction step.
  for (const name of ['xmark', 'eye', 'eye-slash']) {
    assert.ok(registry[name], `the VfInput glyph ${name} is missing`);
  }
  for (const name of ['gear', 'trash', 'magnifying-glass', 'arrow-right', 'check', 'plus']) {
    assert.ok(registry[name], `the registry does not carry ${name}, so migration still needs extraction`);
  }
});

test('no per-component icon blob is tracked outside the icons package', () => {
  const tracked = execFileSync('git', ['-C', repositoryRoot, 'ls-files'], { encoding: 'utf8' }).split('\n');

  assert.deepEqual(
    unauthorizedGeometryBlobs(tracked, read),
    [],
    'A per-component icon artifact is back. The registry is the only neutral icon source.',
  );
});

// The re-audit's escape: the old rule matched /icon.*data.*\.json/i, so a
// hand-written geometry blob only had to be called something else. These drive
// the detector with the payloads that walked past it, and with the shapes it
// must not start rejecting - a filename regex has no false positives to lose,
// and a content check does.
const RAZOR_ICONS = 'packages/razor/resources/icons';

/** Runs the detector over one synthetic file. */
const inspect = (file, document) => unauthorizedGeometryBlobs([file], () => JSON.stringify(document));

test('a hand-written geometry blob is caught however it is named', () => {
  const glyphs = {
    glyphs: {
      'field-required': {
        viewBox: '0 0 24 24',
        body: '<path d="M12 2.5L14 9h7l-5.5 4.2L17.5 20 12 16 6.5 20l2-6.8L3 9h7Z" fill="currentColor"/>',
      },
    },
  };

  // Neither name contains "icon-data", which is all the old guard looked for.
  for (const name of ['field-glyphs.json', 'input-actions.json']) {
    const violations = inspect(`${RAZOR_ICONS}/${name}`, glyphs);

    assert.equal(violations.length, 1, `${name} was not reported`);
    assert.match(violations[0], /carries icon geometry/);
  }
});

test('raw path data is geometry even with no SVG markup around it', () => {
  const violations = inspect(`${RAZOR_ICONS}/field-glyphs.json`, {
    glyphs: { close: { viewBox: '0 0 24 24', d: 'M6 6l12 12M18 6L6 18' } },
  });

  assert.equal(violations.length, 1);
  assert.match(violations[0], /path-data/);
});

test('the generated registries in their approved destinations pass', () => {
  for (const registry of GENERATED_ICON_REGISTRIES) {
    assert.deepEqual(unauthorizedGeometryBlobs([registry], read), [], `${registry} was rejected`);
  }
});

test('an approved registry path without generator provenance is rejected', () => {
  // Closes the obvious follow-up: hand-write the blob, but give it the name and
  // the location the generator writes to.
  const violations = inspect(GENERATED_ICON_REGISTRIES[1], {
    $comment: 'Icons for the field component.',
    icons: { close: { body: '<path d="M6 6l12 12"/>' } },
  });

  assert.equal(violations.length, 1);
  assert.match(violations[0], /does not record .*generate-icon-registry\.mjs/);
});

test('icon metadata that carries no geometry is not rejected', () => {
  // Names, categories and counts are not a second source of truth.
  assert.deepEqual(
    inspect(`${RAZOR_ICONS}/icon-names.json`, {
      icons: ['xmark', 'eye', 'eye-slash'],
      categories: { editing: ['xmark'] },
    }),
    [],
  );
});

test('a visual snapshot manifest without geometry is not rejected', () => {
  assert.deepEqual(
    inspect('packages/icons/__snapshots__/manifest.json', {
      snapshots: [{ name: 'xmark', file: 'xmark.png', sha256: 'a1b2c3', width: 24, height: 24 }],
    }),
    [],
  );
});

test('a "path" that means a filesystem path is not geometry', () => {
  // The false positive a naive key-name check would produce.
  assert.deepEqual(
    inspect('packages/razor/resources/manifest.json', {
      entries: [
        { name: 'tokens', path: 'packages/theme/.generated/theme/tokens.css' },
        { name: 'icons', path: './resources/icons/icon-registry.json', d: 'dist' },
      ],
    }),
    [],
  );
});

test('the icon layout has exactly one hand-written owner', () => {
  const canonical = read('packages/styles/src/components/icon.css');

  for (const rule of ['.vf-icon-wrapper', '.vf-icon', '@keyframes vf-icon-spin', 'prefers-reduced-motion']) {
    assert.ok(canonical.includes(rule), `the canonical icon stylesheet lost ${rule}`);
  }

  // The Vue component forwards to that file instead of declaring the rules a
  // second time. A <style scoped> block with a body here is the duplication
  // M10 removed.
  const iconComponent = read('packages/icons/src/lib/components/icon.vue');
  const styleBlocks = [...iconComponent.matchAll(/<style\b([^>]*)>([\s\S]*?)<\/style>/g)];

  assert.equal(styleBlocks.length, 1, 'the icon component should declare exactly one style block');
  assert.match(styleBlocks[0][1], /src="[^"]*styles\/src\/components\/icon\.css"/);
  assert.equal(styleBlocks[0][2].trim(), '', 'the forwarding style block must have no rules of its own');
});

test('the Razor stylesheet is built from the canonical icon layout', async () => {
  const { styleSources } = await import('../../packages/razor/style-sources.mjs');

  assert.ok(
    styleSources.includes('packages/styles/src/components/icon.css'),
    'the Razor artifact would ship without the icon layout the renderer stopped inlining',
  );
});

test('the Razor renderer injects no icon layout of its own', () => {
  const renderer = read('packages/razor/src/Support/IconRenderer.php');

  // wrapperStyle is per-glyph custom properties. Layout declarations reaching
  // the markup again would resurrect the two parity approvals M10 deleted.
  for (const declaration of ['display:inline-grid', 'place-items', 'transform-origin', 'line-height:0']) {
    assert.ok(!renderer.includes(declaration), `the renderer writes ${declaration} into the markup again`);
  }
});
