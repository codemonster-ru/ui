// The TypeScript half of the cross-language contract.
//
// packages/razor/tests/Support/IconButtonStateVectorsTest.php runs the same
// file against the PHP mirror. If either implementation drifts, one of the two
// suites fails on the vector that moved.
import { describe, expect, it } from 'vitest';
import vectors from '../src/icon-button/state-vectors.json' with { type: 'json' };
import { resolveIconButtonClasses, resolveIconButtonIconSize } from '../src/icon-button/state.js';

describe('shared icon button state vectors', () => {
  it('covers every rule the PHP adapter restates', () => {
    expect(
      Object.keys(vectors)
        .filter((key) => !key.startsWith('$'))
        .sort(),
    ).toEqual(['resolveIconButtonClasses', 'resolveIconButtonIconSize']);
  });

  it('enumerates the whole documented variant and size grid', () => {
    const documented = vectors.resolveIconButtonClasses.filter(
      (vector) => !['nonsense', 'xl'].includes(vector.variant) && !['xl'].includes(vector.size),
    );

    expect(documented).toHaveLength(27);
    expect(new Set(documented.map((vector) => vector.variant)).size).toBe(9);
    expect(new Set(documented.map((vector) => vector.size)).size).toBe(3);
  });

  it.each(vectors.resolveIconButtonClasses)(
    'resolveIconButtonClasses($variant, $size) -> $expected',
    ({ variant, size, expected }) => {
      expect(resolveIconButtonClasses({ variant, size })).toEqual(expected);
    },
  );

  it.each(vectors.resolveIconButtonIconSize)('resolveIconButtonIconSize($size) -> $expected', ({ size, expected }) => {
    expect(resolveIconButtonIconSize(size)).toBe(expected);
  });
});
