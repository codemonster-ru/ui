import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { findUncoveredVerifySteps, parseVerifySteps } from './verify-coverage.mjs';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const workflowPath = resolve(repositoryRoot, '.github/workflows/ci.yml');
const manifest = JSON.parse(readFileSync(resolve(repositoryRoot, 'package.json'), 'utf8'));
const verifyScript = manifest.scripts?.verify;

if (typeof verifyScript !== 'string' || verifyScript.trim() === '') {
  console.error('[verify-coverage] The root package.json must define a verify script.');
  process.exit(1);
}

const workflowText = readFileSync(workflowPath, 'utf8');
const uncovered = findUncoveredVerifySteps(verifyScript, workflowText);

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
  `[verify-coverage] OK: all ${parseVerifySteps(verifyScript).length} verify step(s) run in CI.`,
);
