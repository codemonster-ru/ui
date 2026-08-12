import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cmBorderTokenNames,
  cmBorderTokens,
  cmRadiusTokenNames,
  cmRadiusTokens,
  cmShadowTokenNames,
  cmShadowTokens,
} from '../dist/index.js';

test('owns immutable border and radius foundations', () => {
  assert.deepEqual(Object.keys(cmBorderTokens), [...cmBorderTokenNames]);
  assert.deepEqual(Object.keys(cmRadiusTokens), [...cmRadiusTokenNames]);
  assert.equal(Object.isFrozen(cmBorderTokens), true);
  assert.equal(Object.isFrozen(cmRadiusTokens), true);
  assert.deepEqual(cmBorderTokens, { borderWidth: '1px', borderWidthThick: '2px' });
  assert.deepEqual(cmRadiusTokens, {
    radiusControl: '0.625rem',
    radiusControlTight: '0.5rem',
    radiusSurface: '0.75rem',
    radiusOverlay: '0.875rem',
    radiusRound: '999px',
  });
});

test('owns reusable surface and overlay shadows', () => {
  assert.deepEqual(Object.keys(cmShadowTokens), [...cmShadowTokenNames]);
  assert.equal(Object.isFrozen(cmShadowTokens), true);
  assert.equal(cmShadowTokens.shadowNone, 'none');
  assert.match(cmShadowTokens.shadowSurface, /^0 1px 2px color-mix/);
  assert.match(cmShadowTokens.shadowOverlay, /^0 0\.25rem 0\.625rem color-mix/);

  for (const value of Object.values(cmShadowTokens).filter((value) => value !== 'none')) {
    assert.match(value, /var\(--cm-palette-neutral-1000\)/);
    assert.doesNotMatch(value, /--vf-/);
  }
});
