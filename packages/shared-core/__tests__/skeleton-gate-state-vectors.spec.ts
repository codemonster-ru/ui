// The TypeScript half of the cross-language contract for VfSkeletonGate.
//
// packages/razor/tests/Support/SkeletonGateStateVectorsTest.php runs the same
// file against the PHP mirror. If either implementation drifts, one of the two
// suites fails on the vector that moved.
import { describe, expect, it } from 'vitest';
import vectors from '../src/skeleton-gate/state-vectors.json' with { type: 'json' };
import {
  resolveSkeletonGateContentClasses,
  resolveSkeletonGateLength,
  resolveSkeletonGateMinHeight,
  resolveSkeletonGateOverlayStyle,
  resolveSkeletonGateRootStyle,
} from '../src/skeleton-gate/state.js';

describe('shared skeleton-gate state vectors', () => {
  it('covers every rule the PHP adapter restates', () => {
    expect(
      Object.keys(vectors)
        .filter((key) => !key.startsWith('$'))
        .sort(),
    ).toEqual([
      'resolveSkeletonGateContentClasses',
      'resolveSkeletonGateLength',
      'resolveSkeletonGateMinHeight',
      'resolveSkeletonGateOverlayStyle',
      'resolveSkeletonGateRootStyle',
    ]);
  });

  it('proves a zero reserve is a reservation and an empty reserve is not an absence', () => {
    // The two the reserve precedence is built on. A truthiness check would fold
    // both into "fall through to minHeight", which is the obvious defect: the
    // first would stop reserving, and the second would start.
    expect(resolveSkeletonGateMinHeight(false, 50, 0, false, null)).toBe('0px');
    expect(resolveSkeletonGateMinHeight(false, 50, '', false, null)).toBe('');
  });

  it('proves the measured height applies only while the gate is not ready', () => {
    expect(resolveSkeletonGateMinHeight(false, null, null, true, 84)).toBe('84px');
    expect(resolveSkeletonGateMinHeight(true, null, null, true, 84)).toBeUndefined();
  });

  it('proves a server-side adapter with no measurement is the reference SSR state', () => {
    expect(resolveSkeletonGateMinHeight(false, 40, null, true, null)).toBe(
      resolveSkeletonGateMinHeight(false, 40, null, false, null),
    );
  });

  it('proves the fade duration is always written', () => {
    expect(resolveSkeletonGateRootStyle(undefined, undefined, 220)).toEqual([
      ['--vf-skeleton-gate-fade-duration', '220ms'],
    ]);
  });

  it('proves an empty value survives the rule and is left to the platform serialiser', () => {
    // Deliberately unlike the skeleton's own style rule, which drops it. The
    // gate's reference builds a plain object and lets Vue decide, and Vue
    // decides differently on the client and under SSR.
    expect(resolveSkeletonGateRootStyle('', '', 220)).toEqual([
      ['min-height', ''],
      ['border-radius', ''],
      ['--vf-skeleton-gate-fade-duration', '220ms'],
    ]);
  });

  it('proves the overlay receives the radius and nothing else', () => {
    expect(resolveSkeletonGateOverlayStyle('8px')).toEqual([['border-radius', '8px']]);
    expect(resolveSkeletonGateOverlayStyle(undefined)).toEqual([]);
  });

  it.each(vectors.resolveSkeletonGateLength)('resolveSkeletonGateLength($value) -> $expected', (vector) => {
    expect(resolveSkeletonGateLength(vector.value)).toBe(vector.expected ?? undefined);
  });

  it.each(vectors.resolveSkeletonGateMinHeight)(
    'resolveSkeletonGateMinHeight(ready=$ready, $minHeight, $reserveHeight, preserve=$preserveLastHeight, measured=$measuredContentHeight) -> $expected',
    (vector) => {
      expect(
        resolveSkeletonGateMinHeight(
          vector.ready,
          vector.minHeight,
          vector.reserveHeight,
          vector.preserveLastHeight,
          vector.measuredContentHeight,
        ),
      ).toBe(vector.expected ?? undefined);
    },
  );

  it.each(vectors.resolveSkeletonGateRootStyle)(
    'resolveSkeletonGateRootStyle($minHeight, $radius, $fadeDuration) -> $expected',
    (vector) => {
      expect(
        resolveSkeletonGateRootStyle(vector.minHeight ?? undefined, vector.radius, vector.fadeDuration),
      ).toEqual(vector.expected);
    },
  );

  it.each(vectors.resolveSkeletonGateOverlayStyle)('resolveSkeletonGateOverlayStyle($radius) -> $expected', (vector) => {
    expect(resolveSkeletonGateOverlayStyle(vector.radius)).toEqual(vector.expected);
  });

  it.each(vectors.resolveSkeletonGateContentClasses)(
    'resolveSkeletonGateContentClasses($ready, $normalizeContentSpacing) -> $expected',
    (vector) => {
      expect(resolveSkeletonGateContentClasses(vector.ready, vector.normalizeContentSpacing)).toEqual(vector.expected);
    },
  );
});
