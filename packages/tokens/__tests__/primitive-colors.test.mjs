import assert from 'node:assert/strict';
import test from 'node:test';
import { cmPrimitiveColorTokenNames, cmPrimitiveColorTokens } from '../dist/index.js';

test('defines the complete immutable primitive color contract', () => {
  assert.equal(cmPrimitiveColorTokenNames.length, 66);
  assert.deepEqual(Object.keys(cmPrimitiveColorTokens), [...cmPrimitiveColorTokenNames]);
  assert.equal(new Set(cmPrimitiveColorTokenNames).size, cmPrimitiveColorTokenNames.length);
  assert.equal(Object.isFrozen(cmPrimitiveColorTokenNames), true);
  assert.equal(Object.isFrozen(cmPrimitiveColorTokens), true);
});

test('uses explicit OKLCH values for every primitive color', () => {
  const pattern = /^oklch\(([\d.]+)% ([\d.]+) ([\d.]+)\)$/;

  for (const [name, value] of Object.entries(cmPrimitiveColorTokens)) {
    const match = value.match(pattern);
    assert.ok(match, `${name} must use canonical OKLCH syntax.`);
    const [, lightness, chroma, hue] = match.map(Number);
    assert.ok(lightness >= 0 && lightness <= 100, `${name} lightness is out of range.`);
    assert.ok(chroma >= 0, `${name} chroma is negative.`);
    assert.ok(hue >= 0 && hue < 360, `${name} hue is out of range.`);
  }
});

test('keeps the approved neutral and intent scales', () => {
  const groups = Object.groupBy(cmPrimitiveColorTokenNames, (name) => name.match(/^palette([A-Z][a-z]+)/)?.[1]);

  assert.deepEqual(Object.fromEntries(Object.entries(groups).map(([name, values]) => [name, values.length])), {
    Danger: 8,
    Help: 8,
    Info: 8,
    Neutral: 16,
    Primary: 9,
    Success: 8,
    Warning: 9,
  });
});
