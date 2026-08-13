import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cmBreakpointNames,
  cmBreakpoints,
  cmBreakpointTokenNames,
  cmBreakpointTokens,
  resolveCmBreakpoint,
} from '../dist/index.js';

test('owns the ordered immutable breakpoint registry', () => {
  assert.deepEqual(cmBreakpointNames, ['xs', 'sm', 'md', 'lg', 'xl', '2xl']);
  assert.deepEqual(Object.values(cmBreakpoints), [480, 640, 768, 1024, 1280, 1536]);
  assert.equal(Object.isFrozen(cmBreakpoints), true);
  assert.equal(Object.isFrozen(cmBreakpointNames), true);
});

test('keeps CSS breakpoint tokens synchronized with numeric values', () => {
  assert.deepEqual(Object.keys(cmBreakpointTokens), [...cmBreakpointTokenNames]);
  assert.deepEqual(Object.values(cmBreakpointTokens), Object.values(cmBreakpoints).map((value) => `${value}px`));
  assert.equal(Object.isFrozen(cmBreakpointTokens), true);
  assert.equal(Object.isFrozen(cmBreakpointTokenNames), true);
});

test('resolves only approved breakpoint names', () => {
  assert.equal(resolveCmBreakpoint('md'), 768);
  assert.equal(resolveCmBreakpoint('2xl'), 1536);
  assert.equal(resolveCmBreakpoint('desktop'), null);
});
