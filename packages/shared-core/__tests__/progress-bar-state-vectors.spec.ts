// The TypeScript half of the cross-language contract for VfProgressBar.
//
// packages/razor/tests/Support/ProgressBarStateVectorsTest.php runs the same
// file against the PHP mirror. If either implementation drifts, one of the two
// suites fails on the vector that moved. NaN and Infinity cannot travel through
// JSON, so they are pinned here and in the PHP suite separately.
import { describe, expect, it } from 'vitest';
import vectors from '../src/progress-bar/state-vectors.json' with { type: 'json' };
import {
  formatProgressBarNumber,
  resolveProgressBarClasses,
  resolveProgressBarHeight,
  resolveProgressBarMax,
  resolveProgressBarPercentage,
  resolveProgressBarRootStyle,
  resolveProgressBarValue,
  resolveProgressBarValueLabel,
  resolveProgressBarValueSemantics,
  resolveProgressBarValueStyle,
} from '../src/progress-bar/state.js';
import { resolveProgressSpinnerClasses, resolveProgressSpinnerSize } from '../src/progress-spinner/state.js';
import { resolveSkeletonLength } from '../src/skeleton/state.js';

describe('shared progress bar state vectors', () => {
  it('covers every rule the PHP adapter restates', () => {
    expect(
      Object.keys(vectors)
        .filter((key) => !key.startsWith('$'))
        .sort(),
    ).toEqual([
      'formatProgressBarNumber',
      'resolveProgressBarClasses',
      'resolveProgressBarHeight',
      'resolveProgressBarMax',
      'resolveProgressBarPercentage',
      'resolveProgressBarRootStyle',
      'resolveProgressBarValue',
      'resolveProgressBarValueLabel',
      'resolveProgressBarValueSemantics',
      'resolveProgressBarValueStyle',
    ]);
  });

  it('falls back to 100 for the maximum values JSON cannot carry', () => {
    expect(resolveProgressBarMax(Number.NaN)).toBe(100);
    expect(resolveProgressBarMax(Number.POSITIVE_INFINITY)).toBe(100);
    expect(resolveProgressBarMax(Number.NEGATIVE_INFINITY)).toBe(100);
    expect(resolveProgressBarMax(undefined)).toBe(100);
  });

  it('falls back to 0 for the values JSON cannot carry', () => {
    expect(resolveProgressBarValue(Number.NaN, 100)).toBe(0);
    expect(resolveProgressBarValue(Number.POSITIVE_INFINITY, 100)).toBe(0);
    expect(resolveProgressBarValue(Number.NEGATIVE_INFINITY, 100)).toBe(0);
    expect(resolveProgressBarValue(undefined, 100)).toBe(0);
  });

  it('never divides by zero, because the maximum is resolved first', () => {
    const max = resolveProgressBarMax(0);

    expect(resolveProgressBarPercentage(resolveProgressBarValue(5, max), max)).toBe('5%');
  });

  it('is not the spinner rule under another block name', () => {
    // Same suppressed tone, different block, and the bar has three more
    // modifiers the spinner has no prop for. Restated rather than shared: a
    // bar that started importing the spinner's resolver would lose its
    // striped, animated and indeterminate classes first.
    expect(resolveProgressSpinnerClasses('danger')).toEqual(['vf-progress-spinner', 'vf-progress-spinner--danger']);
    expect(resolveProgressBarClasses({ tone: 'danger', striped: true, animated: true, indeterminate: true })).toEqual([
      'vf-progress-bar',
      'vf-progress-bar--danger',
      'vf-progress-bar--striped',
      'vf-progress-bar--animated',
      'vf-progress-bar--indeterminate',
    ]);
  });

  it('agrees with the spinner size rule and the skeleton length rule today and is its own copy', () => {
    for (const value of [0, 12, 6.5, '1rem', '', undefined]) {
      expect(resolveProgressBarHeight(value)).toBe(resolveProgressSpinnerSize(value));
      expect(resolveProgressBarHeight(value)).toBe(resolveSkeletonLength(value));
    }
  });

  it('keeps an empty height as an empty declaration for the platform serialiser to decide', () => {
    expect(resolveProgressBarRootStyle('')).toEqual([['--vf-progress-bar-height', '']]);
  });

  it('serialises the value and the width from the same number', () => {
    // The independence the harness measures is between the paint and the
    // attribute; the *source* of both is one resolved value. A port that
    // rounded one and not the other would fail one of these.
    const max = resolveProgressBarMax(12);
    const value = resolveProgressBarValue(7, max);

    expect(resolveProgressBarPercentage(value, max)).toBe('58.333333333333336%');
    expect(resolveProgressBarValueSemantics(false, value, max)).toEqual({
      valuemin: '0',
      valuemax: '12',
      valuenow: '7',
    });
  });

  it.each(vectors.formatProgressBarNumber)('formatProgressBarNumber($value) -> $expected', (vector) => {
    expect(formatProgressBarNumber(vector.value)).toBe(vector.expected);
  });

  it.each(vectors.resolveProgressBarMax)('resolveProgressBarMax($max) -> $expected', (vector) => {
    expect(resolveProgressBarMax(vector.max)).toBe(vector.expected);
  });

  it.each(vectors.resolveProgressBarValue)('resolveProgressBarValue($value, $max) -> $expected', (vector) => {
    expect(resolveProgressBarValue(vector.value, vector.max)).toBe(vector.expected);
  });

  it.each(vectors.resolveProgressBarPercentage)('resolveProgressBarPercentage($value, $max) -> $expected', (vector) => {
    expect(resolveProgressBarPercentage(vector.value, vector.max)).toBe(vector.expected);
  });

  it.each(vectors.resolveProgressBarValueLabel)('resolveProgressBarValueLabel($value, $max) -> $expected', (vector) => {
    expect(resolveProgressBarValueLabel(vector.value, vector.max)).toBe(vector.expected);
  });

  it.each(vectors.resolveProgressBarClasses)(
    'resolveProgressBarClasses($tone, $striped, $animated, $indeterminate)',
    (vector) => {
      expect(resolveProgressBarClasses(vector)).toEqual(vector.expected);
    },
  );

  it.each(vectors.resolveProgressBarHeight)('resolveProgressBarHeight($value) -> $expected', (vector) => {
    expect(resolveProgressBarHeight(vector.value)).toBe(vector.expected ?? undefined);
  });

  it.each(vectors.resolveProgressBarRootStyle)('resolveProgressBarRootStyle($height) -> $expected', (vector) => {
    expect(resolveProgressBarRootStyle(vector.height)).toEqual(vector.expected);
  });

  it.each(vectors.resolveProgressBarValueStyle)(
    'resolveProgressBarValueStyle($indeterminate, $percentage)',
    (vector) => {
      expect(resolveProgressBarValueStyle(vector.indeterminate, vector.percentage)).toEqual(vector.expected);
    },
  );

  it.each(vectors.resolveProgressBarValueSemantics)(
    'resolveProgressBarValueSemantics($indeterminate, $value, $max)',
    (vector) => {
      expect(resolveProgressBarValueSemantics(vector.indeterminate, vector.value, vector.max)).toEqual(vector.expected);
    },
  );
});
