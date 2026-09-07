#!/usr/bin/env node
// Gate: the built CSS artifacts still match the reference implementation.
//
// Source-level diffs are not enough for a CSS ownership move: the same rules
// built from a different package can change through import order alone. This
// gate builds each covered package in an immutable checkout of the reference
// commit and in the working tree, then compares every emitted stylesheet.
//
// M10 found this gate covering `packages/core` alone while moving CSS in
// `packages/icons`, so the central change of that milestone was ungated. Every
// package that emits a stylesheet a consumer receives belongs in the list.
//
// Usage:
//   node scripts/baseline/check-css-artifacts.mjs
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { linkDependencies, materialiseReferenceTree } from './isolated-reference.mjs';
import { artifactsDirectory, referenceCommit, repositoryRoot, sha256 } from './reference.mjs';

/** Packages whose built stylesheets are compared against the reference. */
const coveredPackages = [
  { workspace: '@codemonster-ru/vueforge-core', dist: 'packages/core/dist' },
  { workspace: '@codemonster-ru/vueforge-icons', dist: 'packages/icons/dist' },
];

// Vue derives an SFC's scope id from the file's content and stamps it into both
// the selectors and, for a scoped `@keyframes`, the animation name and the
// `animation-name` that points at it. Editing an SFC therefore renames it even
// when no rule changes. The rename is not observable - the DOM attribute is
// generated from the same id, and nothing outside the generated file names it -
// so it is reported rather than failed. Any real rule change still differs
// after normalisation and still fails.
const scopeIdsIn = (css) => [...new Set([...css.matchAll(/data-v-([0-9a-f]{8})/g)].map((match) => match[1]))].sort();

// Only the ids this stylesheet actually declares are neutralised, and only
// those. A blanket `-[0-9a-f]{8}` rule would also rewrite any class or keyframe
// that merely ends in eight hex characters, which would hide a real rule change
// behind the normalisation meant to expose one.
function normaliseScopeIds(css, ids) {
  let normalised = css;

  for (const id of ids) {
    normalised = normalised.replaceAll(id, 'SCOPE');
  }

  return normalised;
}

function buildPackage(treeRoot, workspace) {
  execFileSync('npm', ['run', 'build', '-w', workspace], {
    cwd: treeRoot,
    stdio: ['ignore', 'ignore', 'pipe'],
    encoding: 'utf8',
  });
}

function readStylesheets(treeRoot, dist) {
  const distDirectory = resolve(treeRoot, dist);
  const stylesheets = new Map();

  if (!existsSync(distDirectory)) {
    return stylesheets;
  }

  for (const fileName of readdirSync(distDirectory).sort()) {
    if (fileName.endsWith('.css')) {
      stylesheets.set(fileName, readFileSync(resolve(distDirectory, fileName), 'utf8'));
    }
  }

  return stylesheets;
}

const runDirectory = resolve(artifactsDirectory, 'css-artifacts');
mkdirSync(runDirectory, { recursive: true });
const checkoutDirectory = resolve(runDirectory, 'checkout');

process.stdout.write(`Materialising reference ${referenceCommit}\n`);
materialiseReferenceTree(checkoutDirectory);
linkDependencies(checkoutDirectory);

const differences = [];
const scopeRenames = [];
let compared = 0;

for (const { workspace, dist } of coveredPackages) {
  process.stdout.write(`Building ${workspace} at the reference and in the working tree\n`);
  buildPackage(checkoutDirectory, workspace);
  const reference = readStylesheets(checkoutDirectory, dist);
  buildPackage(repositoryRoot, workspace);
  const current = readStylesheets(repositoryRoot, dist);

  if (reference.size === 0) {
    differences.push(`${dist}: the reference build emitted no stylesheet, so this package is not really covered`);
  }

  for (const [fileName, referenceCss] of reference) {
    const label = `${dist}/${fileName}`;

    if (!current.has(fileName)) {
      differences.push(`${label}: missing in the working tree`);
      continue;
    }

    compared += 1;
    const currentCss = current.get(fileName);

    if (sha256(referenceCss) === sha256(currentCss)) {
      continue;
    }

    const referenceIds = scopeIdsIn(referenceCss);
    const currentIds = scopeIdsIn(currentCss);
    const ids = [...new Set([...referenceIds, ...currentIds])];

    if (normaliseScopeIds(referenceCss, ids) !== normaliseScopeIds(currentCss, ids)) {
      differences.push(
        `${label}: rules differ (reference ${sha256(referenceCss).slice(0, 12)}, ` +
          `current ${sha256(currentCss).slice(0, 12)})`,
      );
      continue;
    }

    if (referenceIds.length === 0) {
      differences.push(`${label}: bytes differ with no scope id to explain it`);
      continue;
    }

    scopeRenames.push(
      `${label}: scope id ${referenceIds.join(', ')} -> ${currentIds.join(', ')}, rules identical`,
    );
  }

  for (const fileName of current.keys()) {
    if (!reference.has(fileName)) {
      differences.push(`${dist}/${fileName}: unexpected in the working tree`);
    }
  }
}

process.stdout.write(`Artifacts: ${relative(repositoryRoot, runDirectory)}\n`);

if (scopeRenames.length > 0) {
  process.stdout.write(`\nScoped-SFC id renames (not observable, reported so they are never silent):\n`);
  for (const rename of scopeRenames) {
    process.stdout.write(`  - ${rename}\n`);
  }
  process.stdout.write('\n');
}

if (differences.length > 0) {
  process.stderr.write(`\nBuilt CSS artifacts drifted from ${referenceCommit}:\n`);
  for (const difference of differences) {
    process.stderr.write(`  - ${difference}\n`);
  }
  process.stderr.write(`\n${differences.length} difference(s).\n`);
  process.exit(1);
}

process.stdout.write(
  `Built CSS artifacts match ${referenceCommit}: ${compared} stylesheets across ` +
    `${coveredPackages.length} package(s), ${scopeRenames.length} scope-id rename(s).\n`,
);
