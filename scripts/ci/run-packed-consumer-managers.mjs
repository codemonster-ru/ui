#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const managerCheck = (manager) =>
  [
    `node ./scripts/ci/check-packed-consumer.mjs --manager=${manager}`,
    `node ./scripts/ci/check-code-monster-ui-packed-consumer.mjs --manager=${manager}`,
    `node ./scripts/ci/check-code-monster-ui-css-packed-consumer.mjs --manager=${manager}`,
  ].join(' && ');

const tasks = [
  {
    name: 'npm',
    command: npmCommand,
    arguments: ['run', 'check:packed-consumer'],
  },
  {
    name: 'pnpm',
    command: npxCommand,
    arguments: ['--yes', '--package=pnpm@10.34.5', '--call', managerCheck('pnpm')],
  },
  {
    name: 'yarn',
    command: npxCommand,
    arguments: ['--yes', '--package=yarn@1.22.22', '--call', managerCheck('yarn')],
  },
];

function runTask(task) {
  console.log(`[packed-consumers] Starting ${task.name}.`);

  return new Promise((resolveTask) => {
    const child = spawn(task.command, task.arguments, {
      cwd: repositoryRoot,
      env: { ...process.env, FORCE_COLOR: '0' },
      stdio: 'inherit',
    });

    child.once('error', (error) => {
      resolveTask({ ...task, error });
    });
    child.once('exit', (code, signal) => {
      resolveTask({ ...task, code, signal });
    });
  });
}

const results = await Promise.all(tasks.map(runTask));
const failures = results.filter((result) => result.error || result.code !== 0);

for (const result of results) {
  if (!result.error && result.code === 0) {
    console.log(`[packed-consumers] ${result.name} passed.`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    const reason = failure.error?.message ?? `exit code ${failure.code}${failure.signal ? ` (${failure.signal})` : ''}`;
    console.error(`[packed-consumers] ${failure.name} failed: ${reason}.`);
  }
  process.exitCode = 1;
}
