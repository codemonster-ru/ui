// The TypeScript half of the cross-language contract for VfDropdown.
//
// packages/razor/tests/Support/DropdownStateVectorsTest.php runs the server
// sections of the same file against the PHP mirror.
import { describe, expect, it } from 'vitest';
import vectors from '../src/dropdown/state-vectors.json' with { type: 'json' };
import * as dropdown from '../src/dropdown/state.js';
import {
  DROPDOWN_OFFSET,
  DROPDOWN_STRATEGY,
  DROPDOWN_TRIGGER_OPEN_KEYS,
  resolveDropdownArrowClasses,
  resolveDropdownArrowOffset,
  resolveDropdownFlipPlacements,
  resolveDropdownMenuClasses,
  resolveDropdownMenuNavigation,
  resolveDropdownOpen,
  resolveDropdownTeleport,
  resolveDropdownTriggerState,
} from '../src/dropdown/state.js';

const rules = Object.keys(vectors)
  .filter((key) => !key.startsWith('$') && key !== 'constants')
  .sort();

describe('shared dropdown state vectors', () => {
  it('covers every exported rule and names the server subset', () => {
    const exportedRules = Object.keys(dropdown)
      .filter((name) => typeof (dropdown as Record<string, unknown>)[name] === 'function')
      .sort();

    expect(rules).toEqual(exportedRules);
    expect(vectors.$serverRules).toEqual(rules.filter((rule) => !/Navigation|ArrowOffset|FlipPlacements/.test(rule)));
  });

  it('exports no focus, listener, escape, floating-runtime or transition rule', () => {
    // What is decided is shared, what is held or run is not. A
    // `computeDropdownPosition`, an `escapeStack` or a `DropdownController`
    // export would land here first.
    expect(
      Object.keys(dropdown).filter((name) =>
        /focus|listen|escape|stack|compute|position|autoUpdate|transition|teleportElement|controller|runtime/i.test(
          name,
        ),
      ),
    ).toEqual([]);
  });

  it('pins the constants the adapters build floater.js and the trigger handler from', () => {
    expect({ DROPDOWN_OFFSET, DROPDOWN_STRATEGY, DROPDOWN_TRIGGER_OPEN_KEYS }).toEqual(vectors.constants);
  });

  it.each(vectors.resolveDropdownOpen)('resolveDropdownOpen %#', ({ disabled, open, expected }) => {
    expect(resolveDropdownOpen(disabled, open)).toBe(expected);
  });

  it.each(vectors.resolveDropdownTriggerState)('resolveDropdownTriggerState %#', ({ disabled, open, expected }) => {
    expect(JSON.parse(JSON.stringify(resolveDropdownTriggerState(disabled, open)))).toEqual(expected);
  });

  it.each(vectors.resolveDropdownMenuClasses)('resolveDropdownMenuClasses %#', ({ variant, placement, expected }) => {
    expect(resolveDropdownMenuClasses(variant, placement)).toEqual(expected);
  });

  it.each(vectors.resolveDropdownArrowClasses)('resolveDropdownArrowClasses %#', ({ placement, expected }) => {
    expect(resolveDropdownArrowClasses(placement)).toEqual(expected);
  });

  it.each(vectors.resolveDropdownFlipPlacements)('resolveDropdownFlipPlacements %#', ({ placement, expected }) => {
    expect(resolveDropdownFlipPlacements(placement)).toEqual(expected);
  });

  it.each(vectors.resolveDropdownArrowOffset)('resolveDropdownArrowOffset %#', ({ data, expected }) => {
    expect(resolveDropdownArrowOffset(data)).toEqual(expected);
  });

  it.each(vectors.resolveDropdownTeleport)('resolveDropdownTeleport %#', (vector) => {
    const teleportTo =
      'teleportTo' in vector ? (vector as { teleportTo: string | false | null }).teleportTo : undefined;

    expect(resolveDropdownTeleport(teleportTo, vector.disableTeleport)).toEqual(vector.expected);
  });

  it('passes an element target through only when the adapter recognises one', () => {
    const element = { tag: 'section' };
    const isElement = (value: unknown): value is typeof element => value === element;

    expect(resolveDropdownTeleport(element, false, isElement)).toEqual({ disabled: false, target: element });
    expect(resolveDropdownTeleport(element, false)).toEqual({ disabled: false, target: 'body' });
  });

  it.each(vectors.resolveDropdownMenuNavigation)('resolveDropdownMenuNavigation %#', (vector) => {
    expect(resolveDropdownMenuNavigation(vector.key, vector.currentIndex, vector.count)).toBe(
      'expected' in vector ? vector.expected : undefined,
    );
  });
});
