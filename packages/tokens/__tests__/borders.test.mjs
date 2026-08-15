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
    radius: '0.75rem',
    radiusControl: 'calc(var(--cm-radius) - 0.125rem)',
    radiusControlTight: 'calc(var(--cm-radius) - 0.25rem)',
    radiusSurface: 'var(--cm-radius)',
    radiusOverlay: 'calc(var(--cm-radius) + 0.125rem)',
    radiusRound: '999px',
  });
});

test('owns reusable surface and overlay shadows', () => {
  assert.deepEqual(Object.keys(cmShadowTokens), [...cmShadowTokenNames]);
  assert.equal(Object.isFrozen(cmShadowTokens), true);
  assert.deepEqual(cmShadowTokens, {
    shadowNone: 'none',
    shadowSurface: '0 1px 2px color-mix(in srgb, var(--cm-color-text-primary) 4%, transparent)',
    shadowOverlay:
      '0 var(--cm-space-1) calc(var(--cm-space-4) * 0.625) color-mix(in srgb, var(--cm-palette-neutral-1000) 16%, transparent), 0 var(--cm-border-width) calc(var(--cm-space-1) / 2) color-mix(in srgb, var(--cm-palette-neutral-1000) 10%, transparent)',
  });

  for (const value of Object.values(cmShadowTokens)) assert.doesNotMatch(value, /--vf-/);
});
