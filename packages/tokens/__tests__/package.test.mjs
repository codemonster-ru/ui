import assert from 'node:assert/strict';
import test from 'node:test';

test('publishes a framework-independent ESM entry', async () => {
  const entry = await import('../dist/index.js');
  assert.deepEqual(Object.keys(entry), [
    'cmPrimitiveColorTokenNames',
    'cmPrimitiveColorTokens',
    'cmSemanticColorTokenNames',
    'cmSemanticDarkColorTokens',
    'cmSemanticLightColorTokens',
    'cmSizingTokenNames',
    'cmSizingTokens',
    'cmSpacingTokenNames',
    'cmSpacingTokens',
    'cmTypographyTokenNames',
    'cmTypographyTokens',
  ]);
});
