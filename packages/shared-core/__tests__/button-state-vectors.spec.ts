// The TypeScript half of the cross-language contract.
//
// packages/razor/tests/Support/ButtonStateVectorsTest.php runs the same file
// against the PHP mirror. If either implementation drifts, one of the two
// suites fails on the vector that moved.
import { describe, expect, it } from 'vitest';
import vectors from '../src/button/state-vectors.json' with { type: 'json' };
import { isButtonDisabled, resolveButtonBusy, resolveButtonClasses } from '../src/button/state.js';

describe('shared button state vectors', () => {
  it('covers every rule the PHP adapter restates', () => {
    expect(
      Object.keys(vectors)
        .filter((key) => !key.startsWith('$'))
        .sort(),
    ).toEqual(['isButtonDisabled', 'resolveButtonBusy', 'resolveButtonClasses']);
  });

  it('enumerates the whole documented variant and size grid', () => {
    const documented = vectors.resolveButtonClasses.filter(
      (vector) => vector.variant !== 'nonsense' && vector.size !== 'xl' && !vector.block && !vector.loading,
    );

    expect(documented).toHaveLength(27);
    expect(new Set(documented.map((vector) => vector.variant)).size).toBe(9);
    expect(new Set(documented.map((vector) => vector.size)).size).toBe(3);
  });

  it('proves loading beats an explicit enabled state', () => {
    expect(isButtonDisabled({ loading: true, disabled: false })).toBe(true);
  });

  it.each(vectors.resolveButtonClasses)(
    'resolveButtonClasses($variant, $size, block=$block, loading=$loading) -> $expected',
    (vector) => {
      expect(resolveButtonClasses(vector)).toEqual(vector.expected);
    },
  );

  it.each(vectors.isButtonDisabled)('isButtonDisabled(loading=$loading, disabled=$disabled) -> $expected', (vector) => {
    expect(isButtonDisabled(vector)).toBe(vector.expected);
  });

  it.each(vectors.resolveButtonBusy)('resolveButtonBusy($loading) -> $expected', (vector) => {
    expect(resolveButtonBusy(vector.loading) ?? null).toBe(vector.expected);
  });
});
