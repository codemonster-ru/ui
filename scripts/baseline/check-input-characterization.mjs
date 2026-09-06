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

// Every file a mutation can rewrite. Since M05 that is the SFC plus the shared
// rules it consumes.
const mutatedPaths = [
  ...new Set([inputSourcePath, ...inputMutations.map((mutation) => mutation.file ?? inputSourcePath)]),
];
const hashesBefore = new Map(mutatedPaths.map((path) => [path, sha256(readFileSync(resolve(repositoryRoot, path)))]));

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

if (leaked.length > 0) {
  process.stderr.write(`A mutation leaked into the source tree: ${leaked.join(', ')}. Restore it before continuing.\n`);
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
