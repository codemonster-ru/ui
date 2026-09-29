// The TypeScript half of the cross-language contract for VfTooltip.
//
// packages/razor/tests/Support/TooltipStateVectorsTest.php runs the server
// sections of the same file against the PHP mirror.
import { describe, expect, it } from 'vitest';
import vectors from '../src/tooltip/state-vectors.json' with { type: 'json' };
import * as tooltip from '../src/tooltip/state.js';
import * as popover from '../src/popover/state.js';
import * as dropdown from '../src/dropdown/state.js';
import {
  TOOLTIP_FLIP_PLACEMENTS,
  TOOLTIP_OFFSET,
  TOOLTIP_OPEN_DELAY,
  TOOLTIP_STRATEGY,
  resolveTooltipArrowClasses,
  resolveTooltipArrowOffset,
  resolveTooltipContentClasses,
  resolveTooltipDescribedBy,
  resolveTooltipHasContent,
  resolveTooltipTeleport,
} from '../src/tooltip/state.js';

const rules = Object.keys(vectors)
  .filter((key) => !key.startsWith('$') && key !== 'constants')
  .sort();

describe('shared tooltip state vectors', () => {
  it('covers every exported rule and names the server subset', () => {
    const exportedRules = Object.keys(tooltip)
      .filter((name) => typeof (tooltip as Record<string, unknown>)[name] === 'function')
      .sort();

    expect(rules).toEqual(exportedRules);
    expect(vectors.$serverRules).toEqual(rules.filter((rule) => /Teleport|HasContent/.test(rule)));
  });

  it('exports no timer, listener, escape-stack, floating-runtime or transition rule', () => {
    expect(
      Object.keys(tooltip).filter((name) =>
        /timer|timeout|listen|stack|escape|compute|position|autoUpdate|transition|controller|runtime|hover|focus/i.test(
          name,
        ),
      ),
    ).toEqual([]);
  });

  it('shares nothing with the popover or dropdown rules: the reference writes each component its own copy', () => {
    const others = new Set<unknown>([...Object.values(popover), ...Object.values(dropdown)]);
    expect(Object.values(tooltip).filter((value) => typeof value === 'function' && others.has(value))).toEqual([]);
  });

  it('pins the constants the adapters build the timer and floater.js from', () => {
    expect({ TOOLTIP_FLIP_PLACEMENTS, TOOLTIP_OFFSET, TOOLTIP_OPEN_DELAY, TOOLTIP_STRATEGY }).toEqual(
      vectors.constants,
    );
  });

  it.each(vectors.resolveTooltipContentClasses)('resolveTooltipContentClasses %#', ({ placement, expected }) => {
    expect(resolveTooltipContentClasses(placement)).toEqual(expected);
  });

  it.each(vectors.resolveTooltipArrowClasses)('resolveTooltipArrowClasses %#', ({ placement, expected }) => {
    expect(resolveTooltipArrowClasses(placement)).toEqual(expected);
  });

  it.each(vectors.resolveTooltipArrowOffset)('resolveTooltipArrowOffset %#', ({ data, expected }) => {
    expect(resolveTooltipArrowOffset(data)).toEqual(expected);
  });

  it.each(vectors.resolveTooltipTeleport)('resolveTooltipTeleport %#', (vector) => {
    const teleportTo =
      'teleportTo' in vector ? (vector as { teleportTo: string | boolean | null }).teleportTo : undefined;

    expect(resolveTooltipTeleport(teleportTo, vector.disableTeleport)).toEqual(vector.expected);
  });

  it('passes an element target through only when the adapter recognises one', () => {
    const element = { tag: 'aside' };
    const isElement = (value: unknown): value is typeof element => value === element;

    expect(resolveTooltipTeleport(element, false, isElement)).toEqual({ disabled: false, target: element });
    expect(resolveTooltipTeleport(element, false)).toEqual({ disabled: false, target: 'body' });
  });

  it.each(vectors.resolveTooltipHasContent)('resolveTooltipHasContent %#', (vector) => {
    const text = 'text' in vector ? (vector as { text: string | null }).text : undefined;

    expect(resolveTooltipHasContent(text, vector.hasContentSlot)).toBe(vector.expected);
  });

  it.each(vectors.resolveTooltipDescribedBy)('resolveTooltipDescribedBy %#', ({ open, id, expected }) => {
    expect(resolveTooltipDescribedBy(open, id) ?? null).toBe(expected);
  });
});
