import assert from 'node:assert/strict';
import test from 'node:test';

test('publishes a framework-independent ESM entry', async () => {
  const entry = await import('../dist/index.js');
  assert.deepEqual(Object.keys(entry), [
    'cmBorderTokenNames',
    'cmBorderTokens',
    'cmBreakpointNames',
    'cmBreakpointTokenNames',
    'cmBreakpointTokens',
    'cmBreakpoints',
    'cmLightThemePreset',
    'cmMotionDurationsMs',
    'cmMotionTokenNames',
    'cmMotionTokens',
    'cmPrimitiveColorTokenNames',
    'cmPrimitiveColorTokens',
    'cmRadiusTokenNames',
    'cmRadiusTokens',
    'cmSemanticColorTokenNames',
    'cmSemanticDarkColorTokens',
    'cmSemanticLightColorTokens',
    'cmShadowTokenNames',
    'cmShadowTokens',
    'cmSizingTokenNames',
    'cmSizingTokens',
    'cmSpacingTokenNames',
    'cmSpacingTokens',
    'cmTypographyTokenNames',
    'cmTypographyTokens',
    'resolveCmBreakpoint',
  ]);
});
