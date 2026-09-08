// The TypeScript half of the cross-language contract.
//
// packages/razor/tests/Support/TextareaStateVectorsTest.php runs the same file
// against the PHP mirror. If either implementation drifts, one of the two
// suites fails on the vector that moved.
import { describe, expect, it } from 'vitest';
import vectors from '../src/textarea/state-vectors.json' with { type: 'json' };
import { isInputFilled } from '../src/input/state.js';
import { resolveTextareaClasses } from '../src/textarea/state.js';

describe('shared textarea state vectors', () => {
  it('covers every rule the PHP adapter restates', () => {
    expect(
      Object.keys(vectors)
        .filter((key) => !key.startsWith('$'))
        .sort(),
    ).toEqual(['resolveTextareaClasses']);
  });

  it('enumerates the whole documented size grid plus a value outside it', () => {
    expect(new Set(vectors.resolveTextareaClasses.map((vector) => vector.size))).toEqual(
      new Set(['sm', 'md', 'lg', 'xl']),
    );
  });

  it.each(vectors.resolveTextareaClasses)(
    'resolveTextareaClasses($size, invalid=$invalid, floating=$floating) -> $expected',
    (vector) => {
      expect(resolveTextareaClasses(vector)).toEqual(vector.expected);
    },
  );

  it('reuses the input filled predicate rather than restating it', () => {
    // The rule VfTextarea applies is string length, not trimmed content, which
    // is why whitespace counts as filled on both components.
    expect(isInputFilled('   ')).toBe(true);
    expect(isInputFilled('')).toBe(false);
    expect(isInputFilled(null)).toBe(false);
  });
});
