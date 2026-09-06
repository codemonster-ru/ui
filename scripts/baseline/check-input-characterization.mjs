#!/usr/bin/env node
// Gate: the VfInput characterization suite must actually detect the known
// first-migration regressions.
//
// The suite is first run unmutated (it must pass), then once per mutation (each
// must fail). Mutations are applied in memory by the Vite plugin in
// input-mutation.vitest.config.mjs; VfInput.vue on disk is never modified, and
// the run verifies that afterwards.
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { inputMutations, inputSourcePath } from './input-mutations.mjs';
import { repositoryRoot, sha256 } from './reference.mjs';

const configPath = resolve(repositoryRoot, 'scripts/baseline/input-mutation.vitest.config.mjs');
const inputFile = resolve(repositoryRoot, inputSourcePath);
const sourceBefore = readFileSync(inputFile);

function runSuite(mutationId) {
  return spawnSync(
    process.execPath,
    [resolve(repositoryRoot, 'node_modules/vitest/vitest.mjs'), 'run', '--config', configPath],
    {
      cwd: repositoryRoot,
      encoding: 'utf8',
      env: { ...process.env, VUEFORGE_INPUT_MUTATION: mutationId ?? '', CI: 'true' },
    },
  );
}

const failures = [];

process.stdout.write('Baseline run (no mutation) — the suite must pass.\n');
const baselineRun = runSuite(null);
if (baselineRun.status !== 0) {
  process.stderr.write(`${baselineRun.stdout}\n${baselineRun.stderr}\n`);
  process.stderr.write('The unmutated characterization suite does not pass; nothing else is meaningful.\n');
  process.exit(1);
}
process.stdout.write('  passed\n\n');

for (const mutation of inputMutations) {
  const run = runSuite(mutation.id);
  const detected = run.status !== 0;
  process.stdout.write(`${detected ? 'detected' : 'MISSED  '}  ${mutation.id} — ${mutation.description}\n`);

  if (!detected) {
    failures.push(mutation);
  }
}

const sourceAfter = readFileSync(inputFile);
const sourceUnchanged = sha256(sourceBefore) === sha256(sourceAfter);
const gitDiff = execFileSync('git', ['-C', repositoryRoot, 'diff', '--name-only', '--', inputSourcePath], {
  encoding: 'utf8',
}).trim();

process.stdout.write(`\n${inputSourcePath} unchanged after the run: ${sourceUnchanged && gitDiff === ''}\n`);

if (!sourceUnchanged || gitDiff !== '') {
  process.stderr.write('A mutation leaked into the source tree. Restore it before continuing.\n');
  process.exit(1);
}

if (failures.length > 0) {
  process.stderr.write(`\n${failures.length} mutation(s) went undetected:\n`);
  for (const mutation of failures) {
    process.stderr.write(`  - ${mutation.id}: ${mutation.description}\n`);
  }
  process.exit(1);
}

process.stdout.write(`All ${inputMutations.length} VfInput regressions are detected by the characterization suite.\n`);
