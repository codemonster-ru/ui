#!/usr/bin/env node
// Gate: the VfInput characterization suite must actually detect the known
// first-migration regressions.
//
// The suite is first run unmutated (it must pass), then once per mutation (each
// must fail). Mutations are applied in memory by the Vite plugin in
// input-mutation.vitest.config.mjs; VfInput.vue on disk is never modified, and
// the run verifies that afterwards.
//
// A mutation run needs explicit outcomes. The independent review found this
// harness collapsing them: when a mutation's search text no longer matched, the
// plugin threw, vitest exited non-zero, and a non-zero exit was read as "the
// suite detected it". Coverage could therefore rot to nothing while the gate
// stayed green. Now a mutation must be applied *and* the suite must fail:
//
//   stale       the search text is not in the source any more   -> gate fails
//   not applied the module was never loaded, so nothing changed -> gate fails
//   run failed  no completed failing test assertions            -> gate fails
//   missed      applied, but the suite still passed             -> gate fails
//   detected    applied, and the suite failed                   -> ok
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { inputMutations, inputSourcePath } from './input-mutations.mjs';
import { repositoryRoot, sha256 } from './reference.mjs';

const configPath = resolve(repositoryRoot, 'scripts/baseline/input-mutation.vitest.config.mjs');
const selfTest = process.argv.includes('--self-test');
// Only the self-test uses this switch. It exercises the real driver's stale
// rejection with an impossible needle, without changing a source file.
const mutations = process.argv.includes('--self-test-stale')
  ? [{ ...inputMutations[0], find: 'THIS_NEEDLE_IS_NOT_IN_THE_SOURCE' }]
  : inputMutations;

// Every file a mutation can rewrite. Since M05 that is the SFC plus the shared
// rules it consumes.
const mutatedPaths = [
  ...new Set([inputSourcePath, ...inputMutations.map((mutation) => mutation.file ?? inputSourcePath)]),
];
const hashesBefore = new Map(mutatedPaths.map((path) => [path, sha256(readFileSync(resolve(repositoryRoot, path)))]));
const markerDirectory = mkdtempSync(resolve(tmpdir(), 'vueforge-input-mutation-'));

function sourceOf(mutation) {
  return readFileSync(resolve(repositoryRoot, mutation.file ?? inputSourcePath), 'utf8');
}

/** Whether the mutation can still find what it was written to break. */
function isStale(mutation) {
  return !sourceOf(mutation).includes(mutation.find);
}

function runSuite(mutationId) {
  const markerPath = resolve(markerDirectory, `${mutationId ?? 'baseline'}.applied`);
  const reportPath = resolve(markerDirectory, `${mutationId ?? 'baseline'}.json`);
  writeFileSync(markerPath, '');

  const run = spawnSync(
    process.execPath,
    [
      resolve(repositoryRoot, 'node_modules/vitest/vitest.mjs'),
      'run',
      '--config',
      configPath,
      '--reporter=json',
      `--outputFile=${reportPath}`,
    ],
    {
      cwd: repositoryRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        VUEFORGE_INPUT_MUTATION: mutationId ?? '',
        VUEFORGE_INPUT_MUTATION_MARKER: markerPath,
        CI: 'true',
      },
    },
  );

  let report = null;
  if (existsSync(reportPath)) {
    try {
      report = JSON.parse(readFileSync(reportPath, 'utf8'));
    } catch {
      // An incomplete reporter output is a run failure, never a detection.
    }
  }
  return {
    ...run,
    report,
    applied: readFileSync(markerPath, 'utf8').split('\n').includes(mutationId),
  };
}

function mutationOutcome(run) {
  if (!run.applied) return 'NOT APPLIED';
  if (run.error || run.signal || run.status === null || !run.report) return 'RUN FAILED';
  if (run.status === 0) return 'MISSED';

  const suites = run.report.testResults;
  const failedAssertions =
    suites?.flatMap((suite) => suite.assertionResults ?? []).filter((assertion) => assertion.status === 'failed') ?? [];
  const suiteLoadFailure =
    !suites?.length ||
    suites.some(
      (suite) =>
        suite.status === 'failed' && !suite.assertionResults?.some((assertion) => assertion.status === 'failed'),
    );
  return run.status === 1 &&
    !suiteLoadFailure &&
    !run.report.numRuntimeErrorTestSuites &&
    failedAssertions.length > 0 &&
    failedAssertions.length === run.report.numFailedTests
    ? 'detected'
    : 'RUN FAILED';
}

// The child must reach the ordinary preflight and exit unsuccessfully. Merely
// testing isStale() would not prove the driver stops counting stale mutations.
if (selfTest) {
  const staleRun = spawnSync(process.execPath, [process.argv[1], '--self-test-stale'], { encoding: 'utf8' });
  const detectedAsStale =
    staleRun.status === 1 &&
    staleRun.stderr.includes('MUTATION_COULD_NOT_BE_APPLIED:STALE') &&
    !staleRun.stdout.includes('detected');
  const realMutationsAreFresh = inputMutations.filter((mutation) => isStale(mutation));
  const assertionFailure = {
    applied: true,
    status: 1,
    report: { numFailedTests: 1, testResults: [{ status: 'failed', assertionResults: [{ status: 'failed' }] }] },
  };
  const outcomes = [
    [assertionFailure, 'detected'],
    [{ ...assertionFailure, applied: false }, 'NOT APPLIED'],
    [{ ...assertionFailure, status: 0 }, 'MISSED'],
    [{ ...assertionFailure, signal: 'SIGTERM' }, 'RUN FAILED'],
    [{ ...assertionFailure, report: null }, 'RUN FAILED'],
    [
      { ...assertionFailure, report: { numFailedTests: 0, testResults: [{ status: 'failed', assertionResults: [] }] } },
      'RUN FAILED',
    ],
  ];
  const classifiedCorrectly = outcomes.every(([run, expected]) => mutationOutcome(run) === expected);

  process.stdout.write(
    `Self-test: actual stale driver exits 1 without detection: ${detectedAsStale}\n` +
      `Self-test: assertion/process failure classification: ${classifiedCorrectly}\n` +
      `Self-test: real mutations that no longer apply: ${realMutationsAreFresh.length}\n`,
  );

  rmSync(markerDirectory, { recursive: true, force: true });

  if (!detectedAsStale || !classifiedCorrectly || realMutationsAreFresh.length > 0) {
    process.stderr.write('The stale-mutation guard is not working, or a committed mutation has gone stale.\n');
    process.exit(1);
  }

  process.stdout.write('A stale mutation fails the gate instead of counting as detected.\n');
  process.exit(0);
}

const failures = [];

// Fail before running anything: a mutation that cannot be applied proves
// nothing, and finding that out from an exit code is how the coverage rotted.
const stale = mutations.filter((mutation) => isStale(mutation));
if (stale.length > 0) {
  process.stderr.write(
    `MUTATION_COULD_NOT_BE_APPLIED:STALE: ${stale.length} mutation(s) no longer match their target:\n` +
      stale.map((mutation) => `  - ${mutation.id} in ${mutation.file ?? inputSourcePath}\n`).join(''),
  );
  rmSync(markerDirectory, { recursive: true, force: true });
  process.exit(1);
}
process.stdout.write(`All ${inputMutations.length} mutations still match their target.\n\n`);

process.stdout.write('Baseline run (no mutation) — the suite must pass.\n');
const baselineRun = runSuite(null);
if (baselineRun.status !== 0) {
  process.stderr.write(`${baselineRun.stdout}\n${baselineRun.stderr}\n`);
  process.stderr.write('The unmutated characterization suite does not pass; nothing else is meaningful.\n');
  rmSync(markerDirectory, { recursive: true, force: true });
  process.exit(1);
}
process.stdout.write('  passed\n\n');

for (const mutation of mutations) {
  const run = runSuite(mutation.id);
  const status = mutationOutcome(run);
  if (status !== 'detected') {
    failures.push(`${mutation.id}: ${status}; no completed failing assertion proves detection`);
    if (status === 'RUN FAILED') process.stderr.write(`${run.stdout ?? ''}\n${run.stderr ?? ''}\n`);
  }

  process.stdout.write(`${status}  ${mutation.id} — ${mutation.description}\n`);
}

// A leak is a file this run changed on disk. Whether a file also differs from
// HEAD is ordinary work in progress and is reported, not failed: mutations are
// applied in memory, so an uncommitted edit is not evidence of a leak.
const leaked = mutatedPaths.filter(
  (path) => sha256(readFileSync(resolve(repositoryRoot, path))) !== hashesBefore.get(path),
);
const modifiedVersusHead = execFileSync('git', ['-C', repositoryRoot, 'diff', '--name-only', '--', ...mutatedPaths], {
  encoding: 'utf8',
})
  .split('\n')
  .filter(Boolean);

process.stdout.write(`\nMutated files unchanged on disk after the run: ${leaked.length === 0}\n`);
for (const path of mutatedPaths) {
  const state = modifiedVersusHead.includes(path) ? 'differs from HEAD (uncommitted work)' : 'matches HEAD';
  process.stdout.write(`  ${path}: ${state}\n`);
}

rmSync(markerDirectory, { recursive: true, force: true });

if (leaked.length > 0) {
  process.stderr.write(`A mutation leaked into the source tree: ${leaked.join(', ')}. Restore it before continuing.\n`);
  process.exit(1);
}

if (failures.length > 0) {
  process.stderr.write(`\n${failures.length} mutation(s) did not prove anything:\n`);
  for (const failure of failures) {
    process.stderr.write(`  - ${failure}\n`);
  }
  process.exit(1);
}

process.stdout.write(`All ${inputMutations.length} VfInput regressions are detected by the characterization suite.\n`);
