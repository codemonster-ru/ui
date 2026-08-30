import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findStaleCiOnlyDeclarations,
  findUncoveredJobs,
  findUncoveredVerifySteps,
  findVerifyGaps,
  parseVerifySteps,
  parseWorkflowScripts,
} from './verify-coverage.mjs';

test('reads the chained verify steps in order without duplicates', () => {
  const verify = 'npm run lint:all && npm run build && npm run typecheck && npm run build';
  assert.deepEqual(parseVerifySteps(verify), ['lint:all', 'build', 'typecheck']);
});

test('reads every npm run step a workflow executes', () => {
  const workflow = `
jobs:
  lint:
    steps:
      - run: npm run lint:all
  packaging:
    steps:
      - run: npm run build
      - run: npm run check:package-contracts
`;
  assert.deepEqual([...parseWorkflowScripts(workflow)].sort(), [
    'build',
    'check:package-contracts',
    'lint:all',
  ]);
});

test('reports verify steps no job runs', () => {
  const verify = 'npm run lint:all && npm run typecheck && npm run check:deferred-budgets';
  const workflow = '      - run: npm run lint:all\n';
  assert.deepEqual(findUncoveredVerifySteps(verify, workflow), ['typecheck', 'check:deferred-budgets']);
});

test('accepts a workflow that covers every verify step across separate jobs', () => {
  const verify = 'npm run lint:all && npm run typecheck';
  const workflow = `
jobs:
  lint:
    steps:
      - run: npm run lint:all
  typecheck:
    steps:
      - run: npm run typecheck
`;
  assert.deepEqual(findUncoveredVerifySteps(verify, workflow), []);
});

test('ignores npm run steps a workflow adds beyond verify', () => {
  const verify = 'npm run lint:all';
  const workflow = '      - run: npm run lint:all\n      - run: npm run check:verify-coverage\n';
  assert.deepEqual(findUncoveredVerifySteps(verify, workflow), []);
});

test('reports a CI step verify does not run', () => {
  const verify = 'npm run lint:all';
  const workflow = '      - run: npm run lint:all\n      - run: npm run pack:all:dry-run\n';
  assert.deepEqual(findVerifyGaps(verify, workflow), ['pack:all:dry-run']);
});

test('accepts a CI-only step once it is declared', () => {
  const verify = 'npm run lint:all';
  const workflow = '      - run: npm run lint:all\n      - run: npm run dev\n';
  assert.deepEqual(findVerifyGaps(verify, workflow, { dev: 'starts a server' }), []);
});

test('reports a declared exception that no longer describes anything', () => {
  const verify = 'npm run lint:all';
  const workflow = '      - run: npm run lint:all\n';
  assert.deepEqual(findStaleCiOnlyDeclarations(verify, workflow, { gone: 'removed long ago' }), ['gone']);
  assert.deepEqual(findStaleCiOnlyDeclarations(verify, workflow, { 'lint:all': 'now in verify' }), ['lint:all']);
});

test('reports a job built from commands that are not npm run', () => {
  const jobs = {
    lint: { steps: [{ run: 'npm run lint:all' }] },
    razor: { steps: [{ run: 'docker run composer:2 sh -lc "composer check"' }] },
  };
  assert.deepEqual(findUncoveredJobs('npm run lint:all', jobs), ['razor']);
  assert.deepEqual(findUncoveredJobs('npm run lint:all', jobs, { razor: 'runs in a container' }), []);
});

test('treats a verify step CI covers by other means as covered', () => {
  const verify = 'npm run lint:all && npm run check:razor-package';
  const workflow = '      - run: npm run lint:all\n';
  assert.deepEqual(findUncoveredVerifySteps(verify, workflow), ['check:razor-package']);
  assert.deepEqual(
    findUncoveredVerifySteps(verify, workflow, { 'check:razor-package': 'a container runs it' }),
    [],
  );
});
