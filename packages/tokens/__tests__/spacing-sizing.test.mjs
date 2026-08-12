import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cmSizingTokenNames,
  cmSizingTokens,
  cmSpacingTokenNames,
  cmSpacingTokens,
} from '../dist/index.js';

function remValue(value) {
  if (value === '0') {
    return 0;
  }
  const match = value.match(/^([\d.]+)rem$/);
  assert.ok(match, `Expected a rem value, received ${value}.`);
  return Number(match[1]);
}

test('defines an ordered immutable spacing scale', () => {
  assert.deepEqual(Object.keys(cmSpacingTokens), [...cmSpacingTokenNames]);
  assert.equal(Object.isFrozen(cmSpacingTokens), true);
  assert.equal(Object.isFrozen(cmSpacingTokenNames), true);
  assert.deepEqual(cmSpacingTokenNames.map((name) => remValue(cmSpacingTokens[name])), [
    0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4,
  ]);
});

test('owns the shared control and icon size scales', () => {
  assert.deepEqual(Object.keys(cmSizingTokens), [...cmSizingTokenNames]);
  assert.equal(Object.isFrozen(cmSizingTokens), true);
  assert.equal(Object.isFrozen(cmSizingTokenNames), true);
  assert.deepEqual(cmSizingTokens, {
    controlHeightSm: '1.75rem',
    controlHeightMd: '2.25rem',
    controlHeightLg: '2.5rem',
    iconSizeSm: '0.875rem',
    iconSizeMd: '1rem',
    iconSizeLg: '1.125rem',
    iconSizeXl: '1.5rem',
  });
});
