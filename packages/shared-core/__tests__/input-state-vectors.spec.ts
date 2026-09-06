// The TypeScript half of the cross-language contract.
//
// packages/razor/tests/Support/InputStateVectorsTest.php runs the same file
// against the PHP mirror. If either implementation drifts, one of the two
// suites fails on the vector that moved.
import { describe, expect, it } from 'vitest';
import vectors from '../src/input/state-vectors.json' with { type: 'json' };
import {
  isClearActionAvailable,
  isInputFilled,
  isPasswordRevealAvailable,
  resolveInputAdornmentState,
  resolveInputType,
} from '../src/input/state.js';

describe('shared input state vectors', () => {
  it('covers every rule the PHP adapter restates', () => {
    expect(
      Object.keys(vectors)
        .filter((key) => !key.startsWith('$'))
        .sort(),
    ).toEqual([
      'isClearActionAvailable',
      'isInputFilled',
      'isPasswordRevealAvailable',
      'resolveInputAdornmentState',
      'resolveInputType',
    ]);
  });

  it.each(vectors.isInputFilled)('isInputFilled($value) -> $expected', ({ value, expected }) => {
    expect(isInputFilled(value)).toBe(expected);
  });

  it.each(vectors.isPasswordRevealAvailable)(
    'isPasswordRevealAvailable($passwordReveal, $type) -> $expected',
    ({ passwordReveal, type, expected }) => {
      expect(isPasswordRevealAvailable({ passwordReveal, type: type ?? undefined })).toBe(expected);
    },
  );

  it.each(vectors.resolveInputType)(
    'resolveInputType($type, $passwordRevealAvailable, $passwordRevealed) -> $expected',
    ({ type, passwordRevealAvailable, passwordRevealed, expected }) => {
      expect(resolveInputType({ type: type ?? undefined, passwordRevealAvailable, passwordRevealed })).toBe(
        expected ?? undefined,
      );
    },
  );

  it.each(vectors.isClearActionAvailable)(
    'isClearActionAvailable($clearable, $filled, $disabled, $readonly) -> $expected',
    ({ clearable, filled, disabled, readonly, expected }) => {
      expect(isClearActionAvailable({ clearable, filled, disabled, readonly })).toBe(expected);
    },
  );

  it.each(vectors.resolveInputAdornmentState)('resolveInputAdornmentState -> $expected', (vector) => {
    const state = resolveInputAdornmentState({
      hasLeadingAdornment: vector.hasLeadingAdornment,
      hasTrailingAdornment: vector.hasTrailingAdornment,
      hasPasswordRevealControl: vector.hasPasswordRevealControl,
      hasClearControl: vector.hasClearControl,
    });

    expect(state).toMatchObject(vector.expected);
  });
});
