// The TypeScript half of the cross-language contract for VfTable.
//
// packages/razor/tests/Support/TableStateVectorsTest.php runs the same file
// against the PHP mirror.
import { describe, expect, it } from 'vitest';
import vectors from '../src/table/state-vectors.json' with { type: 'json' };
import { resolveTableClasses, resolveTableSections } from '../src/table/state.js';

describe('shared table state vectors', () => {
  it('covers every rule the PHP adapter restates', () => {
    expect(
      Object.keys(vectors)
        .filter((key) => !key.startsWith('$'))
        .sort(),
    ).toEqual(['resolveTableClasses', 'resolveTableSections']);
  });

  it('is exhaustive over the sixteen modifier combinations', () => {
    const seen = new Set(
      vectors.resolveTableClasses.map((vector) =>
        [vector.columnDividers, vector.compact, vector.striped, vector.stickyHeader].join(),
      ),
    );

    expect(seen.size).toBe(16);
  });

  it('reads the caption with JavaScript truthiness: "" is none, "0" is one', () => {
    const none = { hasCaptionSlot: false, hasHeaderSlot: false, hasDefaultSlot: false, hasFooterSlot: false };

    expect(resolveTableSections({ ...none, caption: '' }).caption).toBe(false);
    expect(resolveTableSections({ ...none, caption: '0' }).caption).toBe(true);
  });

  it.each(vectors.resolveTableClasses)('resolveTableClasses(%o)', (vector) => {
    const { expected, ...input } = vector;

    expect(resolveTableClasses(input)).toEqual(expected);
  });

  it.each(vectors.resolveTableSections)('resolveTableSections: $$why', (vector) => {
    const { expected, $why: _why, ...input } = vector;

    expect(resolveTableSections(input)).toEqual(expected);
  });
});
