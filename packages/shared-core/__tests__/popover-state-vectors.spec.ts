// The TypeScript half of the cross-language contract for VfPopover.
//
// packages/razor/tests/Support/PopoverStateVectorsTest.php runs the server
// sections of the same file against the PHP mirror.
import { describe, expect, it } from 'vitest';
import vectors from '../src/popover/state-vectors.json' with { type: 'json' };
import * as popover from '../src/popover/state.js';
import * as dropdown from '../src/dropdown/state.js';
import {
  POPOVER_AUTOFOCUS_SELECTOR,
  POPOVER_OFFSET,
  POPOVER_STRATEGY,
  resolvePopoverArrowClasses,
  resolvePopoverArrowOffset,
  resolvePopoverClosesOnEscape,
  resolvePopoverClosesOnOutsideClick,
  resolvePopoverContentClasses,
  resolvePopoverFlipPlacements,
  resolvePopoverTeleport,
  resolvePopoverTriggerKey,
  resolvePopoverTriggerState,
} from '../src/popover/state.js';

const rules = Object.keys(vectors)
  .filter((key) => !key.startsWith('$') && key !== 'constants')
  .sort();

describe('shared popover state vectors', () => {
  it('covers every exported rule and names the server subset', () => {
    const exportedRules = Object.keys(popover)
      .filter((name) => typeof (popover as Record<string, unknown>)[name] === 'function')
      .sort();

    expect(rules).toEqual(exportedRules);
    expect(vectors.$serverRules).toEqual(
      rules.filter((rule) => !/TriggerKey|ArrowOffset|FlipPlacements|ClosesOn/.test(rule)),
    );
  });

  it('exports no focus, listener, escape-stack, floating-runtime or transition rule', () => {
    expect(
      Object.keys(popover).filter((name) =>
        /focus(?!_SELECTOR)|listen|stack|compute|position|autoUpdate|transition|controller|runtime/i.test(name),
      ),
    ).toEqual([]);
  });

  it('shares nothing with the dropdown rules: the reference writes each component its own copy', () => {
    const dropdownValues = new Set<unknown>(Object.values(dropdown));
    expect(Object.values(popover).filter((value) => typeof value === 'function' && dropdownValues.has(value))).toEqual(
      [],
    );
  });

  it('pins the constants the adapters build floater.js and the focus move from', () => {
    expect({ POPOVER_AUTOFOCUS_SELECTOR, POPOVER_OFFSET, POPOVER_STRATEGY }).toEqual(vectors.constants);
  });

  it.each(vectors.resolvePopoverTriggerKey)('resolvePopoverTriggerKey %#', (vector) => {
    expect(resolvePopoverTriggerKey(vector.key)).toBe('expected' in vector ? vector.expected : undefined);
  });

  it.each(vectors.resolvePopoverTriggerState)('resolvePopoverTriggerState %#', ({ open, expected }) => {
    expect(resolvePopoverTriggerState(open)).toEqual(expected);
  });

  it.each(vectors.resolvePopoverContentClasses)('resolvePopoverContentClasses %#', ({ placement, expected }) => {
    expect(resolvePopoverContentClasses(placement)).toEqual(expected);
  });

  it.each(vectors.resolvePopoverArrowClasses)('resolvePopoverArrowClasses %#', ({ placement, expected }) => {
    expect(resolvePopoverArrowClasses(placement)).toEqual(expected);
  });

  it.each(vectors.resolvePopoverFlipPlacements)('resolvePopoverFlipPlacements %#', ({ placement, expected }) => {
    expect(resolvePopoverFlipPlacements(placement)).toEqual(expected);
  });

  it.each(vectors.resolvePopoverArrowOffset)('resolvePopoverArrowOffset %#', ({ data, expected }) => {
    expect(resolvePopoverArrowOffset(data)).toEqual(expected);
  });

  it.each(vectors.resolvePopoverTeleport)('resolvePopoverTeleport %#', (vector) => {
    const teleportTo =
      'teleportTo' in vector ? (vector as { teleportTo: string | false | null }).teleportTo : undefined;

    expect(resolvePopoverTeleport(teleportTo, vector.disableTeleport)).toEqual(vector.expected);
  });

  it('passes an element target through only when the adapter recognises one', () => {
    const element = { tag: 'aside' };
    const isElement = (value: unknown): value is typeof element => value === element;

    expect(resolvePopoverTeleport(element, false, isElement)).toEqual({ disabled: false, target: element });
    expect(resolvePopoverTeleport(element, false)).toEqual({ disabled: false, target: 'body' });
  });

  it.each(vectors.resolvePopoverClosesOnEscape)(
    'resolvePopoverClosesOnEscape %#',
    ({ open, closeOnEscape, expected }) => {
      expect(resolvePopoverClosesOnEscape(open, closeOnEscape)).toBe(expected);
    },
  );

  it.each(vectors.resolvePopoverClosesOnOutsideClick)(
    'resolvePopoverClosesOnOutsideClick %#',
    ({ open, closeOnOutsideClick, expected }) => {
      expect(resolvePopoverClosesOnOutsideClick(open, closeOnOutsideClick)).toBe(expected);
    },
  );
});
