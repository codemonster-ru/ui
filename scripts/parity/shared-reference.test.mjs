// The reference checkout parity:check builds once per run (M35 P0-2).
//
// check-all.mjs builds fd793696 once, seals it with a manifest - what it is and
// every byte it contains - and each profile step verifies that before reading
// it. These tests attack the verification with what could otherwise be served
// silently: another commit, an unfinished build, a changed file, another
// runtime or procedure, another run. The checkouts here are small trees sealed
// with the real sealSharedReference; the real build is proven separately, in
// appendix АЛ, because it takes half a minute.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { afterEach, test } from 'node:test';

import { repositoryRoot } from '../baseline/reference.mjs';
import { prepareSharedReference, sealSharedReference, verifySharedReference } from './targets.mjs';

const manifestName = 'parity-shared-reference.json';
const created = [];
afterEach(() => {
  for (const directory of created.splice(0)) rmSync(directory, { recursive: true, force: true });
});

/** A checkout-shaped tree - sources, a dist, a dependency and a workspace link - sealed for `run`. */
function sealed(run = 'run-a') {
  const directory = mkdtempSync(resolve(tmpdir(), 'vueforge-shared-reference-test-'));
  created.push(directory);
  mkdirSync(resolve(directory, 'packages/core/src'), { recursive: true });
  mkdirSync(resolve(directory, 'packages/icons/dist'), { recursive: true });
  mkdirSync(resolve(directory, 'node_modules/vue'), { recursive: true });
  mkdirSync(resolve(directory, 'node_modules/@codemonster-ru'), { recursive: true });
  writeFileSync(resolve(directory, 'packages/core/src/VfButton.vue'), '<template><button /></template>');
  writeFileSync(resolve(directory, 'packages/icons/dist/index.ts.mjs'), 'export {}');
  writeFileSync(resolve(directory, 'node_modules/vue/index.js'), 'module.exports = {}');
  symlinkSync('../../packages/core', resolve(directory, 'node_modules/@codemonster-ru/vueforge-core'));
  sealSharedReference(directory, run);
  return directory;
}

/** Rewrites one field of the recorded identity, as an artifact built elsewhere would carry it. */
function recordedAs(directory, change) {
  const path = resolve(directory, manifestName);
  const manifest = JSON.parse(readFileSync(path, 'utf8'));
  change(manifest.identity);
  writeFileSync(path, JSON.stringify(manifest));
}

/** Every path, link target and file byte under the tree. */
function treeDigest(directory) {
  const hash = createHash('sha256');
  const walk = (path) => {
    hash.update(path);
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) hash.update(readlinkSync(path));
    else if (stat.isDirectory()) for (const name of readdirSync(path).sort()) walk(resolve(path, name));
    else hash.update(readFileSync(path));
  };
  walk(directory);
  return hash.digest('hex');
}

test('the run that sealed the checkout can use it, and verifying it changes nothing', () => {
  const directory = sealed('run-a');
  const before = treeDigest(directory);
  verifySharedReference(directory, 'run-a');
  verifySharedReference(directory, 'run-a');
  assert.equal(treeDigest(directory), before);
});

test('A: a checkout built for another reference commit is refused', () => {
  const directory = sealed();
  recordedAs(directory, (identity) => {
    identity.referenceCommit = '0000000000000000000000000000000000000000';
  });
  assert.throws(() => verifySharedReference(directory, 'run-a'), /built for another reference/);

  const tree = sealed();
  recordedAs(tree, (identity) => {
    identity.tree = '1111111111111111111111111111111111111111';
  });
  assert.throws(() => verifySharedReference(tree, 'run-a'), /built for another reference/);
});

test('B: a build that did not finish - no manifest - is refused, and a failed build writes none', () => {
  const directory = sealed();
  unlinkSync(resolve(directory, manifestName));
  assert.throws(() => verifySharedReference(directory, 'run-a'), /never completed/);

  // A real failing build: the checkout cannot even be created under a file.
  const parent = mkdtempSync(resolve(tmpdir(), 'vueforge-shared-reference-test-'));
  created.push(parent);
  writeFileSync(resolve(parent, 'blocker'), '');
  const checkout = resolve(parent, 'blocker', 'reference-checkout');
  assert.throws(() => prepareSharedReference(checkout, 'run-a'));
  assert.throws(() => verifySharedReference(checkout, 'run-a'), /never completed/);
});

test('C and E: any change to the checkout after it was sealed is refused - source, output, dependency, link, added or removed file', () => {
  const changes = [
    (directory) => writeFileSync(resolve(directory, 'packages/core/src/VfButton.vue'), '<template><a /></template>'),
    (directory) => writeFileSync(resolve(directory, 'packages/icons/dist/index.ts.mjs'), 'export const x = 1'),
    (directory) => writeFileSync(resolve(directory, 'node_modules/vue/index.js'), 'module.exports = { patched: true }'),
    (directory) => {
      unlinkSync(resolve(directory, 'node_modules/@codemonster-ru/vueforge-core'));
      symlinkSync('../../packages/icons', resolve(directory, 'node_modules/@codemonster-ru/vueforge-core'));
    },
    (directory) => writeFileSync(resolve(directory, 'packages/core/src/Extra.vue'), ''),
    (directory) => unlinkSync(resolve(directory, 'node_modules/vue/index.js')),
  ];
  for (const change of changes) {
    const directory = sealed();
    change(directory);
    assert.throws(() => verifySharedReference(directory, 'run-a'), /changed after it was built/, String(change));
  }
});

test('D: a checkout built by another runtime, platform, procedure or dependency tree is refused', () => {
  for (const change of [
    (identity) => (identity.node = 'v22.0.0'),
    (identity) => (identity.platform = 'linux-x64'),
    (identity) => (identity.procedure[2] = 'a different targets.mjs'),
    (identity) => (identity.dependencies[0] = 'a different package-lock.json'),
  ]) {
    const directory = sealed();
    recordedAs(directory, change);
    assert.throws(() => verifySharedReference(directory, 'run-a'), /built for another reference/, String(change));
  }
});

test('H: a checkout sealed for another run is refused, and a leaked directory without its run is too', () => {
  const directory = sealed('run-a');
  assert.throws(() => verifySharedReference(directory, 'run-b'), /built for another reference/);
  assert.throws(() => verifySharedReference(directory, undefined), /built for another reference/);
});

test('F and G: check-all builds and seals before any step runs, and a profile on its own builds its own checkout', () => {
  const orchestrator = readFileSync(resolve(repositoryRoot, 'scripts/parity/check-all.mjs'), 'utf8');
  assert.ok(
    orchestrator.indexOf('prepareSharedReference(checkout, run)') < orchestrator.indexOf("spawnSync('npm'"),
    'the reference is sealed before the steps start',
  );
  const targets = readFileSync(resolve(repositoryRoot, 'scripts/parity/targets.mjs'), 'utf8');
  assert.match(
    targets,
    /if \(shared\) \{\n\s+verifySharedReference\(shared, process\.env\.PARITY_SHARED_REFERENCE_RUN\);\n\s+\} else \{\n\s+prepareReferenceCheckout\(checkoutDirectory\);/,
  );
  assert.match(
    targets,
    /prepareReferenceCheckout\(checkoutDirectory\);\n\s+sealSharedReference\(checkoutDirectory, run\);/,
  );
});
