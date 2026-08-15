import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cmDarkThemePreset,
  cmLightThemePreset,
  cmSemanticColorTokenNames,
  cmSemanticDarkColorTokens,
} from '../dist/index.js';

test('composes the complete immutable dark preset', () => {
  assert.equal(cmDarkThemePreset.name, 'codemonster-dark');
  assert.equal(cmDarkThemePreset.mode, 'dark');
  assert.equal(Object.isFrozen(cmDarkThemePreset), true);
  assert.equal(Object.isFrozen(cmDarkThemePreset.tokens), true);
  assert.deepEqual(Object.keys(cmDarkThemePreset.tokens), Object.keys(cmLightThemePreset.tokens));
  assert.equal(Object.keys(cmDarkThemePreset.tokens).length, 225);
});

test('changes only semantic colors between default modes', () => {
  const semanticNames = new Set(cmSemanticColorTokenNames);
  let semanticDifferenceCount = 0;

  for (const name of Object.keys(cmDarkThemePreset.tokens)) {
    if (semanticNames.has(name)) {
      assert.equal(cmDarkThemePreset.tokens[name], cmSemanticDarkColorTokens[name]);
      if (cmDarkThemePreset.tokens[name] !== cmLightThemePreset.tokens[name]) {
        semanticDifferenceCount += 1;
      }
    } else {
      assert.equal(cmDarkThemePreset.tokens[name], cmLightThemePreset.tokens[name], `${name} must be mode-neutral.`);
    }
  }

  assert.ok(semanticDifferenceCount > 70);
});
