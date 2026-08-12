import assert from 'node:assert/strict';
import test from 'node:test';
import { cmMotionDurationsMs, cmMotionTokenNames, cmMotionTokens } from '../dist/index.js';

test('owns immutable motion durations and easing', () => {
  assert.deepEqual(Object.keys(cmMotionTokens), [...cmMotionTokenNames]);
  assert.equal(Object.isFrozen(cmMotionTokens), true);
  assert.equal(Object.isFrozen(cmMotionTokenNames), true);
  assert.equal(Object.isFrozen(cmMotionDurationsMs), true);
  assert.deepEqual(cmMotionDurationsMs, { none: 0, fast: 220, normal: 320 });
});

test('keeps CSS and numeric duration values synchronized', () => {
  for (const [name, milliseconds] of Object.entries(cmMotionDurationsMs)) {
    const suffix = `${name[0].toUpperCase()}${name.slice(1)}`;
    assert.equal(cmMotionTokens[`motionDuration${suffix}`], `${milliseconds}ms`);
  }
});

test('uses a valid monotonic cubic-bezier easing', () => {
  const match = cmMotionTokens.motionEaseStandard.match(
    /^cubic-bezier\(([\d.]+), ([\d.]+), ([\d.]+), ([\d.]+)\)$/,
  );
  assert.ok(match);
  const [, x1, y1, x2, y2] = match.map(Number);
  assert.ok(x1 >= 0 && x1 <= 1);
  assert.ok(x2 >= 0 && x2 <= 1);
  assert.ok(y1 >= 0);
  assert.ok(y2 >= 0);
});
