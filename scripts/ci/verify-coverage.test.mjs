import assert from 'node:assert/strict';
import test from 'node:test';
import { findUncoveredVerifySteps, parseVerifySteps, parseWorkflowScripts } from './verify-coverage.mjs';

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
