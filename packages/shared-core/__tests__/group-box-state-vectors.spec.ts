// The TypeScript half of the cross-language contract for VfGroupBox.
//
// packages/razor/tests/Support/GroupBoxStateVectorsTest.php runs the same
// file against the PHP mirror.
import { describe, expect, it } from 'vitest';
import vectors from '../src/group-box/state-vectors.json' with { type: 'json' };
import {
  resolveGroupBoxClasses,
  resolveGroupBoxFlags,
  resolveGroupBoxHasTitle,
  resolveGroupBoxOpen,
} from '../src/group-box/state.js';

describe('shared group box state vectors', () => {
  it('covers every rule the PHP adapter restates, and nothing that would hold state', () => {
    expect(
      Object.keys(vectors)
        .filter((key) => !key.startsWith('$'))
        .sort(),
    ).toEqual(['resolveGroupBoxClasses', 'resolveGroupBoxFlags', 'resolveGroupBoxHasTitle', 'resolveGroupBoxOpen']);
    expect(Object.keys(vectors).filter((key) => /toggle|next|listener|machine/i.test(key))).toEqual([]);
  });

  it('reads the title with JavaScript truthiness: "" is none, "0" is one', () => {
    expect(resolveGroupBoxHasTitle('', false)).toBe(false);
    expect(resolveGroupBoxHasTitle('0', false)).toBe(true);
  });

  it('keeps the vectors raw: both disagreeing spellings are present as strings', () => {
    const titles = vectors.resolveGroupBoxHasTitle.map((vector) => (vector as { title?: string }).title);

    expect(titles).toContain('');
    expect(titles).toContain('0');
  });

  it('lets collapsed win over the seed in both directions', () => {
    expect(resolveGroupBoxOpen(false, true)).toBe(true);
    expect(resolveGroupBoxOpen(true, false)).toBe(false);
  });

  it.each(vectors.resolveGroupBoxHasTitle)('resolveGroupBoxHasTitle($title, $hasTitleSlot) -> $expected', (vector) => {
    const input = vector as { title?: string; hasTitleSlot: boolean; expected: boolean };

    expect(resolveGroupBoxHasTitle(input.title, input.hasTitleSlot)).toBe(input.expected);
  });

  it.each(vectors.resolveGroupBoxOpen)('resolveGroupBoxOpen($collapsed, $defaultCollapsed) -> $expected', (vector) => {
    const input = vector as { collapsed?: boolean; defaultCollapsed?: boolean; expected: boolean };

    expect(resolveGroupBoxOpen(input.collapsed, input.defaultCollapsed)).toBe(input.expected);
  });

  it.each(vectors.resolveGroupBoxFlags)('resolveGroupBoxFlags(%o)', (vector) => {
    const { expected, ...input } = vector as unknown as {
      hasTitle: boolean;
      collapsible: boolean;
      open: boolean;
      disabled: boolean;
      expected: unknown;
    };

    expect(resolveGroupBoxFlags(input)).toEqual(expected);
  });

  it.each(vectors.resolveGroupBoxClasses)('resolveGroupBoxClasses(%o)', (vector) => {
    const { expected, ...input } = vector;

    expect(resolveGroupBoxClasses(input)).toEqual(expected);
  });
});
