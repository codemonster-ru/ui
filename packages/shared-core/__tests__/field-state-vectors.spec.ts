// The TypeScript half of the cross-language contract.
//
// packages/razor/tests/Support/FieldStateVectorsTest.php runs the same file
// against the PHP mirror. If either implementation drifts, one of the two
// suites fails on the vector that moved.
import { describe, expect, it } from 'vitest';
import vectors from '../src/field/state-vectors.json' with { type: 'json' };
import {
  isFieldFloatingLabel,
  isFieldInvalid,
  resolveFieldClasses,
  resolveFieldControlClasses,
  resolveFieldDescribedBy,
} from '../src/field/state.js';

describe('shared field state vectors', () => {
  it('covers every rule the PHP adapter restates', () => {
    expect(
      Object.keys(vectors)
        .filter((key) => !key.startsWith('$'))
        .sort(),
    ).toEqual([
      'isFieldFloatingLabel',
      'isFieldInvalid',
      'resolveFieldClasses',
      'resolveFieldControlClasses',
      'resolveFieldDescribedBy',
    ]);
  });

  it('enumerates the whole placement grid, including a value outside the union', () => {
    expect(vectors.isFieldFloatingLabel).toHaveLength(12);
    expect(new Set(vectors.isFieldFloatingLabel.map((vector) => vector.labelPlacement))).toContain('sideways');
  });

  it('proves floating needs all three signals, not just the placement', () => {
    const asked = vectors.isFieldFloatingLabel.filter((vector) => vector.labelPlacement === 'floating');

    expect(asked.filter((vector) => vector.expected)).toHaveLength(1);
  });

  it.each(vectors.isFieldFloatingLabel)(
    'isFieldFloatingLabel($labelPlacement, label=$hasLabel, supports=$controlSupportsFloating) -> $expected',
    (vector) => {
      expect(isFieldFloatingLabel(vector)).toBe(vector.expected);
    },
  );

  it.each(vectors.isFieldInvalid)('isFieldInvalid(invalid=$invalid, error=$hasError) -> $expected', (vector) => {
    expect(isFieldInvalid(vector)).toBe(vector.expected);
  });

  it.each(vectors.resolveFieldClasses)(
    'resolveFieldClasses(invalid=$invalid, floating=$floating, $floatingVariant) -> $expected',
    (vector) => {
      expect(resolveFieldClasses(vector)).toEqual(vector.expected);
    },
  );

  it.each(vectors.resolveFieldControlClasses)(
    'resolveFieldControlClasses(floating=$floating, filled=$filled) -> $expected',
    (vector) => {
      expect(resolveFieldControlClasses(vector)).toEqual(vector.expected);
    },
  );

  it.each(vectors.resolveFieldDescribedBy)(
    'resolveFieldDescribedBy(description=$hasDescription, error=$hasError) -> $expected',
    (vector) => {
      expect(resolveFieldDescribedBy(vector) ?? null).toBe(vector.expected);
    },
  );
});
