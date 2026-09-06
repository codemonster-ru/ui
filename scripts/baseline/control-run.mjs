#!/usr/bin/env node
// Reference -> reference control run, or -> current with --current.
//
// Two independent immutable checkouts of the same reference commit are built,
// served and captured. The harness is only trustworthy if the two capture sets
// are identical; until this run is clean, no visual baseline may be declared
// reliable (architecture plan, section 18.3).
// --current reuses the same captures/comparator for CI on hosts whose fonts and
// browser differ from the recorded baseline. The immutable reference remains
// the oracle; this command never writes committed baseline data.
import { mkdirSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { captureShowcase } from './capture.mjs';
import { compareCaptureSets, compareEnvironments } from './compare.mjs';
import { buildReference, prepareReference, serveReference } from './isolated-reference.mjs';
import { artifactsDirectory, referenceCommit, repositoryRoot, stableStringify } from './reference.mjs';

const useCurrentTree = process.argv.includes('--current');
const runDirectory = resolve(artifactsDirectory, useCurrentTree ? 'showcase-ci' : 'control-run');
mkdirSync(runDirectory, { recursive: true });

async function captureIndependentReference(label) {
  const checkoutDirectory = resolve(runDirectory, `checkout-${label}`);
  process.stdout.write(`[${label}] materialising reference ${referenceCommit}\n`);
  const reference = await prepareReference(checkoutDirectory);

  try {
    process.stdout.write(`[${label}] capturing ${reference.origin}\n`);
    const captureSet = await captureShowcase({
      origin: reference.origin,
      outputDirectory: resolve(runDirectory, `captures-${label}`),
      label,
    });

    captureSet.provenance = {
      referenceCommit: reference.commit,
      referenceTreeHash: reference.treeHash,
      lockfileSha256: reference.lockfileSha256,
      showcaseIndexSha256: reference.showcaseIndexSha256,
      checkoutDirectory,
    };

    return captureSet;
  } finally {
    await reference.close();
  }
}

async function captureCurrent() {
  process.stdout.write('[current] building the working tree showcase\n');
  const build = buildReference(repositoryRoot);
  const server = await serveReference(repositoryRoot);
  try {
    const captureSet = await captureShowcase({
      origin: server.origin,
      outputDirectory: resolve(runDirectory, 'captures-current'),
      label: 'current',
    });
    captureSet.provenance = { source: 'working-tree', ...build };
    return captureSet;
  } finally {
    await server.close();
  }
}

const first = await captureIndependentReference('a');
const second = useCurrentTree ? await captureCurrent() : await captureIndependentReference('b');

writeFileSync(resolve(runDirectory, 'capture-a.json'), stableStringify(first));
writeFileSync(resolve(runDirectory, 'capture-b.json'), stableStringify(second));

const environmentDifferences = compareEnvironments(first.environment, second.environment);
const captureDifferences = compareCaptureSets(first, second, { expectedLabel: 'run-a', actualLabel: 'run-b' });

const diagnostics = [...first.diagnostics.pageErrors, ...second.diagnostics.pageErrors];

process.stdout.write(
  `\n${useCurrentTree ? 'Showcase CI' : 'Control run'}: ${first.captures.length} captures per run.\n`,
);
process.stdout.write(`Artifacts: ${relative(repositoryRoot, runDirectory)}\n`);

if (!useCurrentTree && first.provenance.showcaseIndexSha256 !== second.provenance.showcaseIndexSha256) {
  process.stdout.write(
    `Note: the two reference builds produced different index.html hashes ` +
      `(${first.provenance.showcaseIndexSha256.slice(0, 12)} vs ` +
      `${second.provenance.showcaseIndexSha256.slice(0, 12)}).\n`,
  );
}

if (diagnostics.length > 0) {
  process.stdout.write(`Page errors observed:\n  - ${diagnostics.join('\n  - ')}\n`);
}

writeFileSync(
  resolve(runDirectory, 'comparison.json'),
  stableStringify({
    referenceCommit,
    direction: useCurrentTree ? 'reference->current' : 'reference->reference',
    captures: first.captures.length,
    cases: first.captures.reduce((total, capture) => total + capture.caseCount, 0),
    environmentDifferences,
    captureDifferences,
    pageErrors: diagnostics,
  }),
);

if (environmentDifferences.length > 0 || captureDifferences.length > 0 || diagnostics.length > 0) {
  process.stderr.write('\nShowcase comparison FAILED:\n');
  for (const difference of [...environmentDifferences, ...captureDifferences]) {
    process.stderr.write(`  - ${difference}\n`);
  }
  process.stderr.write(
    `\n${environmentDifferences.length + captureDifferences.length} difference(s), ${diagnostics.length} page error(s).\n`,
  );
  process.exit(1);
}

process.stdout.write(
  `Showcase comparison passed: reference -> ${useCurrentTree ? 'current' : 'reference'} has 0 differences.\n`,
);
