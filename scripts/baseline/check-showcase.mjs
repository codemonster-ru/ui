#!/usr/bin/env node
// Gate: the showcase still renders the frozen reference route/case matrix.
//
// Usage:
//   node scripts/baseline/check-showcase.mjs                capture the reference and compare
//   node scripts/baseline/check-showcase.mjs --write        record the baseline from the reference
//   node scripts/baseline/check-showcase.mjs --origin=URL   compare an already served candidate
//   node scripts/baseline/check-showcase.mjs --current      build and serve the working tree, then compare
//
// `--current` is the reference -> current drift gate the extraction milestones
// need: it renders the working tree through the same environment the baseline
// was recorded in and compares against it.
//
// `--write` only accepts captures taken from an immutable checkout of the
// reference commit. Current output can never become the baseline: the flag is
// rejected whenever `--origin` or `--current` supplied the captures.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { captureShowcase } from './capture.mjs';
import { compareCaptureSets, compareEnvironments } from './compare.mjs';
import { buildReference, prepareReference, serveReference } from './isolated-reference.mjs';
import {
  artifactsDirectory,
  readJson,
  referenceCommit,
  repositoryRoot,
  showcaseBaselinePath,
  stableStringify,
  writeBaselineJson,
} from './reference.mjs';

const shouldWrite = process.argv.includes('--write');
const useCurrentTree = process.argv.includes('--current');
const originArgument = process.argv.find((argument) => argument.startsWith('--origin='));
const externalOrigin = originArgument ? originArgument.slice('--origin='.length) : null;

if (shouldWrite && (externalOrigin || useCurrentTree)) {
  process.stderr.write(
    'Refusing to write the showcase baseline from current-tree captures. ' +
      'The baseline may only be recorded from an immutable reference checkout.\n',
  );
  process.exit(1);
}

const runDirectory = resolve(artifactsDirectory, externalOrigin || useCurrentTree ? 'current' : 'reference');
mkdirSync(runDirectory, { recursive: true });

let captureSet;
let provenance;

if (externalOrigin) {
  captureSet = await captureShowcase({
    origin: externalOrigin,
    outputDirectory: resolve(runDirectory, 'captures'),
    label: 'current',
  });
  provenance = { source: 'external-origin', origin: externalOrigin };
} else if (useCurrentTree) {
  // The working tree is built and served exactly like the reference checkout,
  // so a difference can only come from the source under migration.
  process.stdout.write('Building the working tree showcase\n');
  const build = buildReference(repositoryRoot);
  const server = await serveReference(repositoryRoot);

  try {
    captureSet = await captureShowcase({
      origin: server.origin,
      outputDirectory: resolve(runDirectory, 'captures'),
      label: 'current',
    });
    provenance = { source: 'working-tree', showcaseIndexSha256: build.showcaseIndexSha256 };
  } finally {
    await server.close();
  }
} else {
  const checkoutDirectory = resolve(runDirectory, 'checkout');
  process.stdout.write(`Materialising reference ${referenceCommit}\n`);
  const reference = await prepareReference(checkoutDirectory);

  try {
    captureSet = await captureShowcase({
      origin: reference.origin,
      outputDirectory: resolve(runDirectory, 'captures'),
      label: 'reference',
    });
    provenance = {
      source: 'immutable-reference-checkout',
      referenceCommit: reference.commit,
      referenceTreeHash: reference.treeHash,
      lockfileSha256: reference.lockfileSha256,
      showcaseIndexSha256: reference.showcaseIndexSha256,
    };
  } finally {
    await reference.close();
  }
}

captureSet.provenance = provenance;
writeFileSync(resolve(runDirectory, 'capture-set.json'), stableStringify(captureSet));

if (captureSet.diagnostics.pageErrors.length > 0) {
  process.stderr.write(`Page errors during capture:\n  - ${captureSet.diagnostics.pageErrors.join('\n  - ')}\n`);
  process.exit(1);
}

if (shouldWrite) {
  await writeBaselineJson(showcaseBaselinePath, { referenceCommit, ...captureSet });
  process.stdout.write(
    `Wrote ${relative(repositoryRoot, showcaseBaselinePath)}: ${captureSet.captures.length} captures ` +
      `from ${referenceCommit}.\n`,
  );
  process.exit(0);
}

if (!existsSync(showcaseBaselinePath)) {
  process.stderr.write(
    `Missing ${relative(repositoryRoot, showcaseBaselinePath)}. ` +
      'Record it with --write from the reference checkout first.\n',
  );
  process.exit(1);
}

const baseline = readJson(showcaseBaselinePath);

if (baseline.referenceCommit !== referenceCommit) {
  process.stderr.write(
    `Baseline provenance mismatch: file records ${baseline.referenceCommit}, harness expects ${referenceCommit}.\n`,
  );
  process.exit(1);
}

const environmentDifferences = compareEnvironments(baseline.environment, captureSet.environment);
const captureDifferences = compareCaptureSets(baseline, captureSet);

process.stdout.write(`Artifacts: ${relative(repositoryRoot, runDirectory)}\n`);

if (environmentDifferences.length > 0) {
  process.stderr.write('\nCapture environment drifted from the recorded baseline:\n');
  for (const difference of environmentDifferences) {
    process.stderr.write(`  - ${difference}\n`);
  }
}

if (captureDifferences.length > 0) {
  process.stderr.write('\nShowcase baseline differences:\n');
  for (const difference of captureDifferences) {
    process.stderr.write(`  - ${difference}\n`);
  }
}

if (environmentDifferences.length > 0 || captureDifferences.length > 0) {
  process.stderr.write(`\n${environmentDifferences.length + captureDifferences.length} difference(s).\n`);
  process.exit(1);
}

const caseTotal = captureSet.captures.reduce((total, capture) => total + capture.caseCount, 0);
process.stdout.write(
  `Showcase baseline matches ${referenceCommit}: ${captureSet.captures.length} captures, ${caseTotal} cases.\n`,
);
