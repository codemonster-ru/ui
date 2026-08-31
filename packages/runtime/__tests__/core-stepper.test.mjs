import assert from 'node:assert/strict';
import test from 'node:test';
import { nextStepperValue, resolveStepperProgress, resolveStepperValue, resolveStepState } from '../dist/core/index.js';

const steps = [{ value: 'account' }, { value: 'billing', disabled: true }, { value: 'review' }, { value: 'done' }];

test('the requested step stays active when it can be', () => {
  assert.equal(resolveStepperValue(steps, 'review'), 'review');
});

test('a disabled or unknown step falls back to the first enabled one', () => {
  assert.equal(resolveStepperValue(steps, 'billing'), 'account');
  assert.equal(resolveStepperValue(steps, 'missing'), 'account');
  assert.equal(resolveStepperValue(steps, null), 'account');
});

test('a stepper with nothing enabled has no active step', () => {
  assert.equal(resolveStepperValue([{ value: 'only', disabled: true }], 'only'), null);
  assert.equal(resolveStepperValue([], null), null);
});

test('a horizontal stepper moves with the left and right arrows', () => {
  assert.equal(nextStepperValue(steps, 'account', 'ArrowRight'), 'review');
  assert.equal(nextStepperValue(steps, 'review', 'ArrowLeft'), 'account');
  assert.equal(nextStepperValue(steps, 'account', 'ArrowDown'), null);
});

test('a vertical stepper moves with the up and down arrows', () => {
  assert.equal(nextStepperValue(steps, 'account', 'ArrowDown', 'vertical'), 'review');
  assert.equal(nextStepperValue(steps, 'review', 'ArrowUp', 'vertical'), 'account');
  assert.equal(nextStepperValue(steps, 'account', 'ArrowRight', 'vertical'), null);
});

test('navigation wraps and jumps to the ends, skipping disabled steps', () => {
  assert.equal(nextStepperValue(steps, 'done', 'ArrowRight'), 'account');
  assert.equal(nextStepperValue(steps, 'account', 'ArrowLeft'), 'done');
  assert.equal(nextStepperValue(steps, 'review', 'Home'), 'account');
  assert.equal(nextStepperValue(steps, 'account', 'End'), 'done');
});

test('progress reports where the active step sits', () => {
  assert.equal(resolveStepperProgress(steps, 'account'), 0);
  assert.equal(resolveStepperProgress(steps, 'done'), 1);
  assert.equal(resolveStepperProgress(steps, 'review'), 2 / 3);
});

test('a stepper with nothing to traverse reports no progress rather than dividing by zero', () => {
  assert.equal(resolveStepperProgress([{ value: 'only' }], 'only'), null);
  assert.equal(resolveStepperProgress([], null), null);
  assert.equal(resolveStepperProgress(steps, 'missing'), null);
});

test('a step reads as complete, current or upcoming relative to the active one', () => {
  assert.equal(resolveStepState(steps, 'review', 'account'), 'complete');
  assert.equal(resolveStepState(steps, 'review', 'review'), 'current');
  assert.equal(resolveStepState(steps, 'review', 'done'), 'upcoming');
});

test('a disabled step stays disabled wherever it sits', () => {
  assert.equal(resolveStepState(steps, 'review', 'billing'), 'disabled');
  assert.equal(resolveStepState(steps, 'done', 'billing'), 'disabled');
  assert.equal(resolveStepState(steps, 'review', 'missing'), 'disabled');
});
