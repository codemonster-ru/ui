// The TypeScript half of the cross-language contract for VfProgressSpinner.
//
// packages/razor/tests/Support/ProgressSpinnerStateVectorsTest.php runs the
// same file against the PHP mirror. If either implementation drifts, one of the
// two suites fails on the vector that moved.
import { describe, expect, it } from 'vitest';
import vectors from '../src/progress-spinner/state-vectors.json' with { type: 'json' };
import {
  resolveProgressSpinnerClasses,
  resolveProgressSpinnerSize,
  resolveProgressSpinnerStyle,
} from '../src/progress-spinner/state.js';
import { resolveAlertClasses } from '../src/alert/state.js';
import { resolveBadgeClasses } from '../src/presentation/state.js';
import { resolveSkeletonLength } from '../src/skeleton/state.js';

describe('shared progress spinner state vectors', () => {
  it('covers every rule the PHP adapter restates', () => {
    expect(
      Object.keys(vectors)
        .filter((key) => !key.startsWith('$'))
        .sort(),
    ).toEqual(['resolveProgressSpinnerClasses', 'resolveProgressSpinnerSize', 'resolveProgressSpinnerStyle']);
  });

  it('suppresses the modifier at primary and nowhere else', () => {
    // The alert's convention, not the badge's: a badge suppresses `neutral`
    // and emits `--primary`. A spinner whose rule was borrowed from the badge
    // would emit the wrong class at exactly two tones.
    expect(resolveProgressSpinnerClasses('primary')).toEqual(['vf-progress-spinner']);
    expect(resolveProgressSpinnerClasses('neutral')).toEqual(['vf-progress-spinner', 'vf-progress-spinner--neutral']);
    expect(resolveBadgeClasses('neutral')).toEqual(['vf-badge']);
    expect(resolveBadgeClasses('primary')).toEqual(['vf-badge', 'vf-badge--primary']);
  });

  it('is not the alert rule under another block name', () => {
    // The two agree on the suppressed tone and differ in the block. Restated
    // rather than shared, so this is what a spinner that started importing the
    // alert's resolver would break first.
    expect(resolveAlertClasses('danger')).toEqual(['vf-alert', 'vf-alert--danger']);
    expect(resolveProgressSpinnerClasses('danger')).toEqual(['vf-progress-spinner', 'vf-progress-spinner--danger']);
  });

  it('proves zero is a length rather than an absence', () => {
    expect(resolveProgressSpinnerSize(0)).toBe('0px');
    expect(resolveProgressSpinnerSize(undefined)).toBeUndefined();
  });

  it('agrees with the skeleton length rule today and is its own copy', () => {
    // Same shape, two contracts. The gate's copy of this rule exists for the
    // same reason; the assertion is that they agree, not that they are one.
    for (const value of [0, 40, 12.5, '2em', '', undefined]) {
      expect(resolveProgressSpinnerSize(value)).toBe(resolveSkeletonLength(value));
    }
  });

  it('writes one custom property and nothing else', () => {
    expect(resolveProgressSpinnerStyle(40)).toEqual([['--vf-progress-spinner-size', '40px']]);
    expect(resolveProgressSpinnerStyle(undefined)).toEqual([]);
  });

  it('keeps an empty size as an empty declaration for the platform serialiser to decide', () => {
    // The skeleton gate's convention, not the skeleton's: the reference hands
    // a plain object to Vue, and the two Vue serialisers disagree about an
    // empty value. The rule must not decide for them, or the SSR bytes move.
    expect(resolveProgressSpinnerStyle('')).toEqual([['--vf-progress-spinner-size', '']]);
  });

  it.each(vectors.resolveProgressSpinnerClasses)('resolveProgressSpinnerClasses($tone) -> $expected', (vector) => {
    expect(resolveProgressSpinnerClasses(vector.tone)).toEqual(vector.expected);
  });

  it.each(vectors.resolveProgressSpinnerSize)('resolveProgressSpinnerSize($value) -> $expected', (vector) => {
    // `null` in JSON stands for the absent prop, which the rule reports as
    // undefined rather than as the string "null".
    expect(resolveProgressSpinnerSize(vector.value)).toBe(vector.expected ?? undefined);
  });

  it.each(vectors.resolveProgressSpinnerStyle)('resolveProgressSpinnerStyle($size) -> $expected', (vector) => {
    expect(resolveProgressSpinnerStyle(vector.size)).toEqual(vector.expected);
  });
});
