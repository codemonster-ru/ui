#!/usr/bin/env node
// parity:check (M35 P0-2): the immutable reference is built once per run.
//
// Until P0-2 every profile step materialised, linked and built the reference
// checkout of fd793696 for itself - 34 identical builds of an unchanging
// commit (appendix АЛ). Here the checkout is built once into a directory of
// this run only, its manifest is written last, and the profile steps -
// unchanged, in parity:check:profiles - verify it before each use. A profile
// run on its own still builds its own.
//
// The directory and its run token exist only for this process: an interrupted
// run leaves a directory no later run is ever pointed at.
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { artifactsDirectory } from '../baseline/reference.mjs';
import { prepareSharedReference } from './targets.mjs';

const directory = mkdtempSync(resolve(artifactsDirectory, 'parity-shared-reference-'));
const checkout = resolve(directory, 'reference-checkout');
const run = randomUUID();
let status;

try {
  const started = performance.now();
  prepareSharedReference(checkout, run);
  process.stdout.write(
    `Shared reference built once for this run in ${((performance.now() - started) / 1000).toFixed(1)} s: ${checkout}\n`,
  );
  status =
    spawnSync('npm', ['run', 'parity:check:profiles'], {
      stdio: 'inherit',
      env: { ...process.env, PARITY_SHARED_REFERENCE: checkout, PARITY_SHARED_REFERENCE_RUN: run },
    }).status ?? 1;
} finally {
  rmSync(directory, { recursive: true, force: true });
}

process.exit(status);
