// The TypeScript half of the cross-language contract for VfSkeleton.
//
// packages/razor/tests/Support/SkeletonStateVectorsTest.php runs the same file
// against the PHP mirror. If either implementation drifts, one of the two
// suites fails on the vector that moved.
import { describe, expect, it } from 'vitest';
import vectors from '../src/skeleton/state-vectors.json' with { type: 'json' };
import { resolveSkeletonClasses, resolveSkeletonLength, resolveSkeletonStyle } from '../src/skeleton/state.js';

describe('shared skeleton state vectors', () => {
  it('covers every rule the PHP adapter restates', () => {
    expect(
      Object.keys(vectors)
        .filter((key) => !key.startsWith('$'))
        .sort(),
    ).toEqual(['resolveSkeletonClasses', 'resolveSkeletonLength', 'resolveSkeletonStyle']);
  });

  it('proves the animation modifier is present at the default and absent when switched off', () => {
    // The opposite polarity to every modifier migrated before it: here the
    // default state is the one that *does* emit. A port that copied the M15
    // "the default emits nothing" convention would produce a skeleton that
    // never shimmers, and nothing about the rendered box would look wrong.
    expect(resolveSkeletonClasses(true)).toEqual(['vf-skeleton', 'vf-skeleton--animated']);
    expect(resolveSkeletonClasses(false)).toEqual(['vf-skeleton']);
  });

  it('proves zero is a length rather than an absence', () => {
    expect(resolveSkeletonLength(0)).toBe('0px');
    expect(resolveSkeletonLength(undefined)).toBeUndefined();
  });

  it('proves an empty value drops the declaration instead of meaning zero', () => {
    // The quirk that produces a skeleton with no style attribute at all.
    expect(resolveSkeletonStyle('', '')).toEqual([]);
  });

  it.each(vectors.resolveSkeletonClasses)('resolveSkeletonClasses($animated) -> $expected', (vector) => {
    expect(resolveSkeletonClasses(vector.animated)).toEqual(vector.expected);
  });

  it.each(vectors.resolveSkeletonLength)('resolveSkeletonLength($value) -> $expected', (vector) => {
    // `null` in JSON stands for the absent prop, which the rule reports as
    // undefined rather than as the string "null".
    expect(resolveSkeletonLength(vector.value)).toBe(vector.expected ?? undefined);
  });

  it.each(vectors.resolveSkeletonStyle)('resolveSkeletonStyle($minHeight, $radius) -> $expected', (vector) => {
    expect(resolveSkeletonStyle(vector.minHeight, vector.radius)).toEqual(vector.expected);
  });
});
