#!/usr/bin/env node
// Gate: the built CSS artifacts still match the reference implementation.
//
// Source-level diffs are not enough for a CSS ownership move: the same rules
// built from a different package can change through import order alone. This
// gate builds `packages/core` in an immutable checkout of the reference commit
// and in the working tree, then compares every emitted stylesheet byte for byte.
//
// Usage:
//   node scripts/baseline/check-css-artifacts.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { linkDependencies, materialiseReferenceTree } from './isolated-reference.mjs';
import { artifactsDirectory, referenceCommit, repositoryRoot, sha256 } from './reference.mjs';

function buildCorePackage(treeRoot) {
  execFileSync('npm', ['run', 'build', '-w', '@codemonster-ru/vueforge-core'], {
    cwd: treeRoot,
    stdio: ['ignore', 'ignore', 'pipe'],
    encoding: 'utf8',
  });
}

function hashStylesheets(treeRoot) {
  const distDirectory = resolve(treeRoot, 'packages/core/dist');
  const hashes = new Map();

  for (const fileName of readdirSync(distDirectory).sort()) {
    if (!fileName.endsWith('.css')) {
      continue;
    }

    hashes.set(fileName, sha256(readFileSync(resolve(distDirectory, fileName))));
  }

  return hashes;
}

const runDirectory = resolve(artifactsDirectory, 'css-artifacts');
mkdirSync(runDirectory, { recursive: true });
const checkoutDirectory = resolve(runDirectory, 'checkout');

process.stdout.write(`Materialising reference ${referenceCommit}\n`);
materialiseReferenceTree(checkoutDirectory);
linkDependencies(checkoutDirectory);
process.stdout.write('Building the reference core package\n');
buildCorePackage(checkoutDirectory);
const referenceHashes = hashStylesheets(checkoutDirectory);

process.stdout.write('Building the working tree core package\n');
buildCorePackage(repositoryRoot);
const currentHashes = hashStylesheets(repositoryRoot);

const differences = [];

for (const [fileName, hash] of referenceHashes) {
  if (!currentHashes.has(fileName)) {
    differences.push(`${fileName}: missing in the working tree`);
    continue;
  }
  if (currentHashes.get(fileName) !== hash) {
    differences.push(
      `${fileName}: content differs (reference ${hash.slice(0, 12)}, current ${currentHashes.get(fileName).slice(0, 12)})`,
    );
  }
}

for (const fileName of currentHashes.keys()) {
  if (!referenceHashes.has(fileName)) {
    differences.push(`${fileName}: unexpected in the working tree`);
  }
}

process.stdout.write(`Artifacts: ${relative(repositoryRoot, runDirectory)}\n`);

if (differences.length > 0) {
  process.stderr.write(`\nBuilt CSS artifacts drifted from ${referenceCommit}:\n`);
  for (const difference of differences) {
    process.stderr.write(`  - ${difference}\n`);
  }
  process.stderr.write(`\n${differences.length} difference(s).\n`);
  process.exit(1);
}

process.stdout.write(
  `Built CSS artifacts match ${referenceCommit}: ${referenceHashes.size} stylesheets byte-identical.\n`,
);
