// The TypeScript half of the cross-language contract for VfFieldset.
//
// packages/razor/tests/Support/FieldsetStateVectorsTest.php runs the same file
// against the PHP mirror.
import { describe, expect, it } from 'vitest';
import vectors from '../src/fieldset/state-vectors.json' with { type: 'json' };
import {
  isFieldsetInvalid,
  resolveFieldsetClasses,
  resolveFieldsetDescribedBy,
  resolveFieldsetPresence,
} from '../src/fieldset/state.js';

const noSlots = { hasLabelSlot: false, hasDescriptionSlot: false, hasErrorSlot: false };

describe('shared fieldset state vectors', () => {
  it('covers every rule the PHP adapter restates', () => {
    expect(
      Object.keys(vectors)
        .filter((key) => !key.startsWith('$'))
        .sort(),
    ).toEqual(['isFieldsetInvalid', 'resolveFieldsetClasses', 'resolveFieldsetDescribedBy', 'resolveFieldsetPresence']);
  });

  it('reads the props with JavaScript truthiness: "" is none, "0" is one', () => {
    expect(resolveFieldsetPresence({ ...noSlots, label: '', description: '', error: '' })).toEqual({
      label: false,
      description: false,
      error: false,
    });
    expect(resolveFieldsetPresence({ ...noSlots, label: '0', description: '0', error: '0' })).toEqual({
      label: true,
      description: true,
      error: true,
    });
  });

  it('keeps the vectors raw: both disagreeing spellings are present as strings', () => {
    const labels = vectors.resolveFieldsetPresence.map((vector) => vector.label);

    expect(labels).toContain('');
    expect(labels).toContain('0');
  });

  it('returns undefined, not an empty string, when there is nothing to describe', () => {
    expect(
      resolveFieldsetDescribedBy({ descriptionId: 'd', errorId: 'e', hasDescription: false, hasError: false }),
    ).toBe(undefined);
  });

  it.each(vectors.resolveFieldsetPresence)('resolveFieldsetPresence: $$why', (vector) => {
    const { expected, $why: _why, ...input } = vector;

    expect(resolveFieldsetPresence(input)).toEqual(expected);
  });

  it.each(vectors.isFieldsetInvalid)('isFieldsetInvalid(%o)', (vector) => {
    expect(isFieldsetInvalid({ invalid: vector.invalid, hasError: vector.hasError })).toBe(vector.expected);
  });

  it.each(vectors.resolveFieldsetDescribedBy)('resolveFieldsetDescribedBy(%o)', (vector) => {
    const { expected, $why: _why, ...input } = vector as typeof vector & { $why?: string };

    expect(resolveFieldsetDescribedBy(input) ?? null).toBe(expected);
  });

  it.each(vectors.resolveFieldsetClasses)('resolveFieldsetClasses($invalid) -> $expected', (vector) => {
    expect(resolveFieldsetClasses(vector.invalid)).toEqual(vector.expected);
  });
});
