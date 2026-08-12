import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cmBorderTokenNames,
  cmBreakpointTokenNames,
  cmLightThemePreset,
  cmMotionTokenNames,
  cmPrimitiveColorTokenNames,
  cmRadiusTokenNames,
  cmSemanticColorTokenNames,
  cmShadowTokenNames,
  cmSizingTokenNames,
  cmSpacingTokenNames,
  cmTypographyTokenNames,
} from '../dist/index.js';

const groupNames = [
  cmPrimitiveColorTokenNames,
  cmSemanticColorTokenNames,
  cmSpacingTokenNames,
  cmSizingTokenNames,
  cmTypographyTokenNames,
  cmBorderTokenNames,
  cmRadiusTokenNames,
  cmShadowTokenNames,
  cmMotionTokenNames,
  cmBreakpointTokenNames,
];

function cssNameToTokenName(name) {
  return name.replace(/^--cm-/, '').replace(/-([a-z0-9])/g, (_, character) => character.toUpperCase());
}

test('composes every token group into the immutable light preset', () => {
  const declaredNames = groupNames.flat();
  assert.equal(declaredNames.length, 206);
  assert.equal(new Set(declaredNames).size, declaredNames.length, 'Token groups must not overlap.');
  assert.deepEqual(Object.keys(cmLightThemePreset.tokens), declaredNames);
  assert.equal(cmLightThemePreset.name, 'codemonster-light');
  assert.equal(cmLightThemePreset.mode, 'light');
  assert.equal(Object.isFrozen(cmLightThemePreset), true);
  assert.equal(Object.isFrozen(cmLightThemePreset.tokens), true);
});

test('resolves every light preset alias inside the complete token graph', () => {
  const tokenNames = new Set(Object.keys(cmLightThemePreset.tokens));

  for (const [name, value] of Object.entries(cmLightThemePreset.tokens)) {
    for (const match of value.matchAll(/var\((--cm-[a-z0-9-]+)\)/g)) {
      assert.ok(tokenNames.has(cssNameToTokenName(match[1])), `${name} references unknown ${match[1]}.`);
    }
  }
});
