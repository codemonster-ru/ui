// The TypeScript half of the cross-language contract for VfAccordion.
//
// packages/razor/tests/Support/AccordionStateVectorsTest.php runs the same
// file against the PHP mirror.
import { describe, expect, it } from 'vitest';
import vectors from '../src/accordion/state-vectors.json' with { type: 'json' };
import {
  resolveAccordionIconClasses,
  resolveAccordionOpen,
  resolveAccordionTransition,
} from '../src/accordion/state.js';

describe('shared accordion state vectors', () => {
  it('covers every rule the PHP adapter restates, and nothing that would hold state', () => {
    expect(
      Object.keys(vectors)
        .filter((key) => !key.startsWith('$'))
        .sort(),
    ).toEqual(['resolveAccordionIconClasses', 'resolveAccordionOpen', 'resolveAccordionTransition']);
  });

  it('lets the controlled prop win over the seed in both directions', () => {
    expect(resolveAccordionOpen(false, true)).toBe(false);
    expect(resolveAccordionOpen(true, false)).toBe(true);
  });

  it('treats only undefined as absence: an explicit false is a controlled closed accordion', () => {
    expect(resolveAccordionOpen(undefined, true)).toBe(true);
    expect(resolveAccordionOpen(false, true)).toBe(false);
  });

  it('exports no toggle, no listener and no next-state rule', () => {
    // The plan's line: what is decided is shared, what is held is not. A
    // future `toggleAccordion` or `AccordionState` export lands here first.
    expect(Object.keys(vectors).filter((key) => /toggle|next|listener|machine/i.test(key))).toEqual([]);
  });

  it('writes height before opacity in the transition, both over the normal duration', () => {
    const declaration = resolveAccordionTransition();

    expect(declaration.indexOf('height')).toBeLessThan(declaration.indexOf('opacity'));
    expect(declaration.match(/var\(--vf-motion-duration-normal\)/g)).toHaveLength(2);
    expect(declaration).not.toMatch(/\d+ms/);
  });

  it.each(vectors.resolveAccordionOpen)('resolveAccordionOpen($open, $defaultOpen) -> $expected', (vector) => {
    const input = vector as { open?: boolean; defaultOpen?: boolean; expected: boolean };

    expect(resolveAccordionOpen(input.open, input.defaultOpen)).toBe(input.expected);
  });

  it.each(vectors.resolveAccordionIconClasses)('resolveAccordionIconClasses($open) -> $expected', (vector) => {
    expect(resolveAccordionIconClasses(vector.open)).toEqual(vector.expected);
  });

  it.each(vectors.resolveAccordionTransition)('resolveAccordionTransition() -> $expected', (vector) => {
    expect(resolveAccordionTransition()).toBe(vector.expected);
  });
});
