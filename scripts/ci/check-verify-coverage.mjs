import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { load as parseYaml } from 'js-yaml';
import {
  findStaleCiOnlyDeclarations,
  findUncoveredJobs,
  findUncoveredVerifySteps,
  findVerifyGaps,
  parseVerifySteps,
} from './verify-coverage.mjs';

/**
 * CI steps `verify` deliberately does not run, each with the reason it cannot.
 *
 * Anything CI runs that is not here and not in `verify` is reported, because "verify passed" is
 * what everyone reads as "this branch is good" — and twice now that reading was wrong.
 */
const ciOnlyJobs = {
  razor: 'runs the PHP adapter suite in a container; verify runs the same suite when PHP is installed',
  visual:
    'downloads a pinned Chrome build and captures against live servers; a different browser reports differences that are not real',
};

/**
 * `verify` steps CI performs by other means, with how.
 *
 * The Razor suite is the case: `verify` shells out to a local PHP toolchain, while CI runs the same
 * `composer check` inside a container that is guaranteed to have one.
 */
const coveredElsewhere = {
  'check:razor-package': 'the razor job runs the same composer check inside a container',
};

const ciOnlySteps = {
  'visual:cross-platform:capture':
    'drives a pinned Chrome build against two live servers; a different browser reports differences that are not real',
  'visual:cross-platform:razor-render': 'renders through the PHP adapter, which verify cannot assume is installed',
  'visual:cross-platform:serve': 'serves the cross-platform cases for a pinned browser to capture',
};

const repositoryRoot = resolve(import.meta.dirname, '../..');
const workflowPath = resolve(repositoryRoot, '.github/workflows/ci.yml');
const manifest = JSON.parse(readFileSync(resolve(repositoryRoot, 'package.json'), 'utf8'));
const verifyScript = manifest.scripts?.verify;

if (typeof verifyScript !== 'string' || verifyScript.trim() === '') {
  console.error('[verify-coverage] The root package.json must define a verify script.');
  process.exit(1);
}

const workflowText = readFileSync(workflowPath, 'utf8');
const uncovered = findUncoveredVerifySteps(verifyScript, workflowText, coveredElsewhere);
const gaps = findVerifyGaps(verifyScript, workflowText, ciOnlySteps);
const uncoveredJobs = findUncoveredJobs(verifyScript, parseYaml(workflowText).jobs ?? {}, ciOnlyJobs);

if (uncoveredJobs.length > 0) {
  console.error('[verify-coverage] A CI job runs nothing verify runs, and is not declared CI-only:');
  for (const job of uncoveredJobs) {
    console.error(`[verify-coverage]   ${job}`);
  }
  process.exit(1);
}
const stale = findStaleCiOnlyDeclarations(verifyScript, workflowText, ciOnlySteps);

if (gaps.length > 0) {
  console.error('[verify-coverage] CI runs steps verify does not, and none of them is declared CI-only.');
  for (const step of gaps) {
    console.error(`[verify-coverage]   only CI runs: npm run ${step}`);
  }
  console.error('[verify-coverage] Add it to verify, or declare it in ciOnlySteps with the reason it cannot run.');
  process.exit(1);
}

if (stale.length > 0) {
  console.error('[verify-coverage] A declared CI-only step no longer needs the exception:');
  for (const step of stale) {
    console.error(`[verify-coverage]   ${step}`);
  }
  process.exit(1);
}

if (uncovered.length > 0) {
  console.error(
    '[verify-coverage] CI splits verify across jobs, so every verify step must run in some job.',
  );
  for (const step of uncovered) {
    console.error(`[verify-coverage]   no job runs: npm run ${step}`);
  }
  console.error('[verify-coverage] Add the step to a job in .github/workflows/ci.yml.');
  process.exit(1);
}

console.log(
  `[verify-coverage] OK: all ${parseVerifySteps(verifyScript).length} verify step(s) run in CI, and the ` +
    `${Object.keys(ciOnlySteps).length} step(s) and ${Object.keys(ciOnlyJobs).length} job(s) only CI runs, ` +
    `plus ${Object.keys(coveredElsewhere).length} covered by other means, are declared with a reason.`,
);
