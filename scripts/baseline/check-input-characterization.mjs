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
import { componentMutations, inputSourcePath } from './input-mutations.mjs';
import { repositoryRoot, sha256 } from './reference.mjs';

const configPath = resolve(repositoryRoot, 'scripts/baseline/input-mutation.vitest.config.mjs');
const selfTest = process.argv.includes('--self-test');
// Only the self-test uses this switch. It exercises the real driver's stale
// rejection with an impossible needle, without changing a source file.
const mutations = process.argv.includes('--self-test-stale')
  ? [{ ...componentMutations[0], find: 'THIS_NEEDLE_IS_NOT_IN_THE_SOURCE' }]
  : componentMutations;

// Every file a mutation can rewrite. Since M05 that is the SFC plus the shared
// rules it consumes.
const mutatedPaths = [
  ...new Set([inputSourcePath, ...componentMutations.map((mutation) => mutation.file ?? inputSourcePath)]),
];
const hashesBefore = new Map(mutatedPaths.map((path) => [path, sha256(readFileSync(resolve(repositoryRoot, path)))]));
const markerDirectory = mkdtempSync(resolve(tmpdir(), 'vueforge-input-mutation-'));

function sourceOf(mutation) {
  return readFileSync(resolve(repositoryRoot, mutation.file ?? inputSourcePath), 'utf8');
}

/** Whether the mutation can still find what it was written to break. */
function isStale(mutation) {
  const source = sourceOf(mutation);

  return (mutation.edits ?? [mutation]).some((edit) => !source.includes(edit.find));
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

function mutationOutcome(run, mutation) {
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
  const wellFormedFailure =
    run.status === 1 &&
    !suiteLoadFailure &&
    !run.report.numRuntimeErrorTestSuites &&
    failedAssertions.length > 0 &&
    failedAssertions.length === run.report.numFailedTests;

  if (!wellFormedFailure) return 'RUN FAILED';

  // A mutation may name the characterization suite that has to be the one that
  // fails. M15 needs it: VfBadge and VfTag are near-identical, so "the run
  // failed somewhere" would let a Badge mutation be credited to Tag's evidence.
  // A batch is only worth running if one component's failure cannot stand in as
  // another component's proof.
  //
  // The rule is deliberately narrow: the named suite must fail, and no *other
  // component's* characterization suite may fail. A shared catalog suite such as
  // components.spec.ts is allowed to fail alongside it - a real regression
  // should break that too, and forbidding it would only reward weaker mutations.
  if (mutation?.suite) {
    const failingSuites = (suites ?? [])
      .filter((suite) => (suite.assertionResults ?? []).some((assertion) => assertion.status === 'failed'))
      .map((suite) => (suite.name ?? '').split('\\').join('/'));
    const namedSuiteFailed = failingSuites.some((name) => name.endsWith(mutation.suite));
    // M17 is the first milestone with a component that renders another, and it
    // breaks the "exactly one component's suite may fail" rule for a real
    // reason: a defect in VfSkeleton *should* reach VfSkeletonGate's evidence,
    // because the gate's loading half is whatever the child renders. Leaving
    // that as a tolerated exception would have made the rule mean "one or two,
    // whichever happened", so a mutation instead declares which consumer suites
    // it expects to take down, and each of them has to actually fail. The
    // coupling becomes a measured claim rather than a hole:
    //
    //   - a child mutation that stopped reaching the gate fails here, which is
    //     how "the gate really consumes the canonical skeleton" stays true;
    //   - a gate mutation that reached the *skeleton's* suite fails here too,
    //     because it declares no alsoFails, and that is the other direction of
    //     the same proof - the dependency runs one way.
    const expected = new Set([mutation.suite, ...(mutation.alsoFails ?? [])]);
    const declaredButPassing = (mutation.alsoFails ?? []).filter(
      (name) => !failingSuites.some((failing) => failing.endsWith(name)),
    );
    const otherComponentFailed = failingSuites.some(
      (name) => name.endsWith('.characterization.spec.ts') && ![...expected].some((allow) => name.endsWith(allow)),
    );

    if (!namedSuiteFailed || otherComponentFailed || declaredButPassing.length > 0) return 'WRONG SUITE';
  }

  return 'detected';
}

// The child must reach the ordinary preflight and exit unsuccessfully. Merely
// testing isStale() would not prove the driver stops counting stale mutations.
if (selfTest) {
  const staleRun = spawnSync(process.execPath, [process.argv[1], '--self-test-stale'], { encoding: 'utf8' });
  const detectedAsStale =
    staleRun.status === 1 &&
    staleRun.stderr.includes('MUTATION_COULD_NOT_BE_APPLIED:STALE') &&
    !staleRun.stdout.includes('detected');
  const realMutationsAreFresh = componentMutations.filter((mutation) => isStale(mutation));
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
process.stdout.write(`All ${componentMutations.length} mutations still match their target.\n\n`);

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
  const status = mutationOutcome(run, mutation);
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
// `git diff` cannot see a file that is not tracked yet, so a brand new rule
// file would be reported as matching HEAD when it does not exist there at all.
// `git status` distinguishes the three states this line is meant to tell apart.
const statusVersusHead = new Map(
  execFileSync('git', ['-C', repositoryRoot, 'status', '--porcelain', '--', ...mutatedPaths], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
    .map((line) => [line.slice(3).trim(), line.slice(0, 2)]),
);

process.stdout.write(`\nMutated files unchanged on disk after the run: ${leaked.length === 0}\n`);
for (const path of mutatedPaths) {
  const code = statusVersusHead.get(path);
  const state =
    code === undefined
      ? 'matches HEAD'
      : code === '??'
        ? 'untracked (new in this working tree)'
        : 'differs from HEAD (uncommitted work)';
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

process.stdout.write(
  `All ${componentMutations.length} VfInput, VfIconButton, VfField, VfButton, VfTextarea, VfCheckbox, VfRadio, VfSwitch, VfBadge, VfTag, VfDivider, VfSkeleton, VfAvatar, VfCard, VfSkeletonGate, VfPanel, VfAlert, VfProgressSpinner, VfProgressBar and VfAccordion regressions are detected by the characterization suites.\n`,
);
