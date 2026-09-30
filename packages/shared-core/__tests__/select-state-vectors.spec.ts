// The TypeScript half of the cross-language contract for VfSelect.
//
// packages/razor/tests/Support/SelectStateVectorsTest.php runs the server
// sections of the same file against the PHP mirror.
import { describe, expect, it } from 'vitest';
import vectors from '../src/select/state-vectors.json' with { type: 'json' };
import * as select from '../src/select/state.js';
import {
  SELECT_OFFSET,
  SELECT_SCROLL_PADDING,
  SELECT_STRATEGY,
  SELECT_TRIGGER_OPEN_KEYS,
  resolveSelectDisplayLabel,
  resolveSelectFieldFilled,
  resolveSelectFlipPlacements,
  resolveSelectFocusIndex,
  resolveSelectForwardsAttribute,
  resolveSelectHasClearControl,
  resolveSelectHasValue,
  resolveSelectMenuClasses,
  resolveSelectMenuNavigation,
  resolveSelectRendersHiddenInput,
  resolveSelectScrollTop,
  resolveSelectSelectedOption,
  resolveSelectTeleport,
  resolveSelectTriggerClasses,
  resolveSelectWrapperClasses,
} from '../src/select/state.js';

const rules = Object.keys(vectors)
  .filter((key) => !key.startsWith('$') && key !== 'constants')
  .sort();

describe('shared select state vectors', () => {
  it('covers every exported rule and names the server subset', () => {
    const exportedRules = Object.keys(select)
      .filter((name) => typeof (select as Record<string, unknown>)[name] === 'function')
      .sort();

    expect(rules).toEqual(exportedRules);
    expect(vectors.$serverRules).toEqual(
      rules.filter((rule) => !/Navigation|FocusIndex|FlipPlacements|MenuClasses|ScrollTop/.test(rule)),
    );
  });

  it('exports no focus, listener, escape, floating-runtime, transition or form-runtime rule', () => {
    expect(
      Object.keys(select).filter((name) =>
        /focusElement|listen|escape|stack|compute|position|autoUpdate|transition|controller|runtime|submit|reset|activedescendant/i.test(
          name,
        ),
      ),
    ).toEqual([]);
  });

  it('pins the constants the adapters build floater.js, the trigger handler and the scroll from', () => {
    expect({ SELECT_OFFSET, SELECT_SCROLL_PADDING, SELECT_STRATEGY, SELECT_TRIGGER_OPEN_KEYS }).toEqual(
      vectors.constants,
    );
  });

  it.each(vectors.resolveSelectHasValue)('resolveSelectHasValue %#', ({ modelValue, expected }) => {
    expect(resolveSelectHasValue(modelValue)).toBe(expected);
  });

  it.each(vectors.resolveSelectSelectedOption)(
    'resolveSelectSelectedOption %#',
    ({ options, modelValue, expected }) => {
      expect(resolveSelectSelectedOption(options, modelValue) ?? null).toEqual(expected);
    },
  );

  it('returns the option object itself, not a copy', () => {
    const options = [{ value: 'a', label: 'A' }];

    expect(resolveSelectSelectedOption(options, 'a')).toBe(options[0]);
  });

  it.each(vectors.resolveSelectDisplayLabel)('resolveSelectDisplayLabel %#', (vector) => {
    const { floating, expected } = vector;
    const selectedLabel = 'selectedLabel' in vector ? vector.selectedLabel : undefined;
    const placeholder = 'placeholder' in vector ? vector.placeholder : undefined;

    expect(resolveSelectDisplayLabel(selectedLabel, floating, placeholder)).toBe(expected);
  });

  it.each(vectors.resolveSelectHasClearControl)(
    'resolveSelectHasClearControl %#',
    ({ clearable, hasValue, disabled, expected }) => {
      expect(resolveSelectHasClearControl(clearable, hasValue, disabled)).toBe(expected);
    },
  );

  it.each(vectors.resolveSelectRendersHiddenInput)('resolveSelectRendersHiddenInput %#', (vector) => {
    expect(resolveSelectRendersHiddenInput('name' in vector ? vector.name : undefined)).toBe(vector.expected);
  });

  it.each(vectors.resolveSelectForwardsAttribute)('resolveSelectForwardsAttribute %#', ({ name, expected }) => {
    expect(resolveSelectForwardsAttribute(name)).toBe(expected);
  });

  it.each(vectors.resolveSelectWrapperClasses)('resolveSelectWrapperClasses %#', ({ state, expected }) => {
    expect(resolveSelectWrapperClasses(state)).toEqual(expected);
  });

  it.each(vectors.resolveSelectTriggerClasses)('resolveSelectTriggerClasses %#', ({ state, expected }) => {
    expect(resolveSelectTriggerClasses(state)).toEqual(expected);
  });

  it.each(vectors.resolveSelectMenuClasses)('resolveSelectMenuClasses %#', ({ placement, expected }) => {
    expect(resolveSelectMenuClasses(placement)).toEqual(expected);
  });

  it.each(vectors.resolveSelectFlipPlacements)('resolveSelectFlipPlacements %#', ({ placement, expected }) => {
    expect(resolveSelectFlipPlacements(placement)).toEqual(expected);
  });

  it.each(vectors.resolveSelectTeleport)('resolveSelectTeleport %#', (vector) => {
    const teleportTo =
      'teleportTo' in vector ? (vector as { teleportTo: string | false | null }).teleportTo : undefined;

    expect(resolveSelectTeleport(teleportTo, vector.disableTeleport)).toEqual(vector.expected);
  });

  it('passes an element target through only when the adapter recognises one', () => {
    const element = { tag: 'section' };
    const isElement = (value: unknown): value is typeof element => value === element;

    expect(resolveSelectTeleport(element, false, isElement)).toEqual({ disabled: false, target: element });
    expect(resolveSelectTeleport(element, false)).toEqual({ disabled: false, target: 'body' });
  });

  it.each(vectors.resolveSelectFocusIndex)('resolveSelectFocusIndex %#', ({ options, modelValue, expected }) => {
    expect(resolveSelectFocusIndex(options, modelValue)).toBe(expected);
  });

  it.each(vectors.resolveSelectMenuNavigation)('resolveSelectMenuNavigation %#', (vector) => {
    expect(resolveSelectMenuNavigation(vector.key, vector.currentIndex, vector.count)).toBe(
      'expected' in vector ? vector.expected : undefined,
    );
  });

  it.each(vectors.resolveSelectFieldFilled)('resolveSelectFieldFilled %#', ({ hasValue, open, expected }) => {
    expect(resolveSelectFieldFilled(hasValue, open)).toBe(expected);
  });

  it.each(vectors.resolveSelectScrollTop)('resolveSelectScrollTop %#', (vector) => {
    expect(resolveSelectScrollTop(vector.item)).toBe('expected' in vector ? vector.expected : undefined);
  });
});
