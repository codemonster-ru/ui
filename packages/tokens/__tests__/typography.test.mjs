import assert from 'node:assert/strict';
import test from 'node:test';
import { cmTypographyTokenNames, cmTypographyTokens } from '../dist/index.js';

test('defines the immutable typography foundation', () => {
  assert.deepEqual(Object.keys(cmTypographyTokens), [...cmTypographyTokenNames]);
  assert.equal(Object.isFrozen(cmTypographyTokens), true);
  assert.equal(Object.isFrozen(cmTypographyTokenNames), true);
  assert.equal(cmTypographyTokenNames.length, 17);
});

test('keeps font size and weight scales strictly ordered', () => {
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'].map((suffix) => {
    const value = cmTypographyTokens[`fontSize${suffix[0].toUpperCase()}${suffix.slice(1)}`];
    return Number(value.replace('rem', ''));
  });
  const weights = ['Regular', 'Medium', 'Semibold', 'Bold'].map((suffix) =>
    Number(cmTypographyTokens[`fontWeight${suffix}`]),
  );

  assert.deepEqual([...sizes].sort((left, right) => left - right), sizes);
  assert.deepEqual([...weights].sort((left, right) => left - right), weights);
  assert.equal(new Set(sizes).size, sizes.length);
  assert.equal(new Set(weights).size, weights.length);
});

test('uses portable system fallbacks for every font family', () => {
  assert.match(cmTypographyTokens.fontFamilyBase, /system-ui/);
  assert.match(cmTypographyTokens.fontFamilyHeading, /system-ui/);
  assert.match(cmTypographyTokens.fontFamilyMono, /ui-monospace/);
});
