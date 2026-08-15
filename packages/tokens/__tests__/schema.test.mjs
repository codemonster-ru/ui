import assert from 'node:assert/strict';
import test from 'node:test';

import { cmDarkThemePreset, cmLightThemePreset, cmThemeTokenNames, cmThemeTokenSchema } from '../dist/index.js';

test('defines the complete immutable token schema', () => {
  assert.deepEqual(Object.keys(cmThemeTokenSchema), [
    'primitiveColor',
    'semanticColor',
    'spacing',
    'sizing',
    'control',
    'typography',
    'border',
    'radius',
    'shadow',
    'motion',
    'breakpoint',
  ]);
  assert.deepEqual(
    Object.fromEntries(Object.entries(cmThemeTokenSchema).map(([group, names]) => [group, names.length])),
    {
      primitiveColor: 66,
      semanticColor: 85,
      spacing: 11,
      sizing: 7,
      control: 18,
      typography: 17,
      border: 2,
      radius: 6,
      shadow: 3,
      motion: 4,
      breakpoint: 6,
    },
  );
  assert.equal(Object.isFrozen(cmThemeTokenSchema), true);
  assert.equal(Object.isFrozen(cmThemeTokenNames), true);
});

test('covers both presets once and in declaration order', () => {
  assert.equal(cmThemeTokenNames.length, 225);
  assert.equal(new Set(cmThemeTokenNames).size, cmThemeTokenNames.length);
  assert.deepEqual(cmThemeTokenNames, Object.keys(cmLightThemePreset.tokens));
  assert.deepEqual(cmThemeTokenNames, Object.keys(cmDarkThemePreset.tokens));
});
