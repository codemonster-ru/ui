// The TypeScript half of the cross-language contract for VfStepper.
//
// packages/razor/tests/Support/StepperStateVectorsTest.php runs the same file
// against the PHP mirror.
import { describe, expect, it } from 'vitest';
import vectors from '../src/stepper/state-vectors.json' with { type: 'json' };
import {
  formatStepperProgressFactor,
  resolveStepperActiveValue,
  resolveStepperClasses,
  resolveStepperContentPosition,
  resolveStepperFallbackValue,
  resolveStepperRootStyle,
  resolveStepperStepState,
  type VfStepperContentPositionName,
  type VfStepperItemLike,
  type VfStepperOrientationName,
} from '../src/stepper/state.js';

type Orientation = VfStepperOrientationName;
type Position = VfStepperContentPositionName | undefined;

describe('shared stepper state vectors', () => {
  it('covers every rule the PHP adapter restates, and nothing that would hold state or know a key', () => {
    expect(
      Object.keys(vectors)
        .filter((key) => !key.startsWith('$'))
        .sort(),
    ).toEqual([
      'formatStepperProgressFactor',
      'resolveStepperActiveValue',
      'resolveStepperClasses',
      'resolveStepperContentPosition',
      'resolveStepperFallbackValue',
      'resolveStepperRootStyle',
      'resolveStepperStepState',
    ]);
  });

  it('exports no next, previous, select, wrap, focus or listener rule', () => {
    // The plan's line: what is decided is shared, what is held is not. A
    // future `selectStep`, `nextStep` or `StepperState` export lands here first.
    expect(
      Object.keys(vectors).filter((key) => /next|previous|select|wrap|focus|listen|machine|controller/i.test(key)),
    ).toEqual([]);
  });

  it('writes the progress factor as JavaScript does, not as a fixed-precision string', () => {
    expect(formatStepperProgressFactor(1 / 3)).toBe('0.3333333333333333');
    expect(formatStepperProgressFactor(1 / 3)).not.toBe('0.33333333333333');
    expect(formatStepperProgressFactor(2 / 3)).toBe('0.6666666666666666');
    expect(formatStepperProgressFactor(1)).toBe('1');
  });

  it('computes the factor from the division itself, so the vectors are the division results', () => {
    expect(resolveStepperRootStyle([{ value: 'a' }, { value: 'b' }, { value: 'c' }, { value: 'd' }], 'b')).toEqual([
      ['--vf-stepper-item-count', '4'],
      ['--vf-stepper-progress-factor', formatStepperProgressFactor(1 / 3)],
    ]);
  });

  it.each(vectors.resolveStepperContentPosition)(
    'resolveStepperContentPosition($orientation, $contentPosition) -> $expected',
    (vector) => {
      expect(resolveStepperContentPosition(vector.orientation as Orientation, vector.contentPosition as Position)).toBe(
        vector.expected,
      );
    },
  );

  it.each(vectors.resolveStepperClasses)(
    'resolveStepperClasses($orientation, $contentPosition) -> $expected',
    (vector) => {
      expect(resolveStepperClasses(vector.orientation as Orientation, vector.contentPosition as Position)).toEqual(
        vector.expected,
      );
    },
  );

  it.each(vectors.resolveStepperFallbackValue)('resolveStepperFallbackValue($items) -> $expected', (vector) => {
    expect(resolveStepperFallbackValue(vector.items)).toBe(vector.expected ?? undefined);
  });

  it.each(vectors.resolveStepperActiveValue)(
    'resolveStepperActiveValue($modelValue, $internalValue, …) -> $expected',
    (vector) => {
      const input = vector as {
        modelValue?: string | null;
        internalValue?: string;
        items: VfStepperItemLike[];
        expected: string | null;
      };

      expect(resolveStepperActiveValue(input.modelValue, input.internalValue, input.items)).toBe(
        input.expected ?? undefined,
      );
    },
  );

  it.each(vectors.resolveStepperStepState)('resolveStepperStepState(…, $activeValue) -> $expected', (vector) => {
    const input = vector as { items: VfStepperItemLike[]; activeValue?: string; expected: string[] };

    expect(input.items.map((item) => resolveStepperStepState(input.items, input.activeValue, item))).toEqual(
      input.expected,
    );
  });

  it.each(vectors.formatStepperProgressFactor)('formatStepperProgressFactor($factor) -> $expected', (vector) => {
    expect(formatStepperProgressFactor(vector.factor)).toBe(vector.expected);
  });

  it.each(vectors.resolveStepperRootStyle)('resolveStepperRootStyle(…, $activeValue) -> $expected', (vector) => {
    const input = vector as { items: VfStepperItemLike[]; activeValue?: string; expected: [string, string][] };

    expect(resolveStepperRootStyle(input.items, input.activeValue)).toEqual(input.expected);
  });
});
