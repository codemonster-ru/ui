// The TypeScript half of the cross-language contract for VfTabs.
//
// packages/razor/tests/Support/TabsStateVectorsTest.php runs the server
// sections of the same file against the PHP mirror; the browser sections -
// navigation, indicator, scroller - are run here alone, because a server
// never holds the numbers they take.
import { describe, expect, it } from 'vitest';
import vectors from '../src/tabs/state-vectors.json' with { type: 'json' };
import {
  isTabsItemSelected,
  resolveTabsActiveIndex,
  resolveTabsActiveValue,
  resolveTabsControlledPanelId,
  resolveTabsFallbackValue,
  resolveTabsIndicatorStyle,
  resolveTabsNavigationTarget,
  resolveTabsPanelId,
  resolveTabsScrollerState,
  resolveTabsScrollerStep,
  resolveTabsTabId,
  resolveTabsTabIndex,
  type VfTabsIndicatorMeasurement,
  type VfTabsItemLike,
  type VfTabsScrollerMeasurement,
} from '../src/tabs/state.js';

describe('shared tabs state vectors', () => {
  it('covers every rule, and names the server subset the PHP adapter restates', () => {
    const rules = Object.keys(vectors)
      .filter((key) => !key.startsWith('$'))
      .sort();

    expect(rules).toEqual([
      'isTabsItemSelected',
      'resolveTabsActiveIndex',
      'resolveTabsActiveValue',
      'resolveTabsControlledPanelId',
      'resolveTabsFallbackValue',
      'resolveTabsIndicatorStyle',
      'resolveTabsNavigationTarget',
      'resolveTabsPanelId',
      'resolveTabsScrollerState',
      'resolveTabsScrollerStep',
      'resolveTabsTabId',
      'resolveTabsTabIndex',
    ]);
    expect(vectors.$serverRules).toEqual(rules.filter((rule) => !/Navigation|Indicator|Scroller/.test(rule)));
  });

  it('exports no select, activate, focus, listener, timer or observer rule', () => {
    // What is decided is shared, what is held is not. A `selectTab`, a
    // `TabsState` or a `ScrollerController` export would land here first.
    expect(
      Object.keys(vectors).filter((key) =>
        /select(?!ed)|activate|focus|listen|timer|observer|machine|controller/i.test(key),
      ),
    ).toEqual([]);
  });

  it.each(vectors.resolveTabsFallbackValue)('resolveTabsFallbackValue($items) -> $expected', (vector) => {
    expect(resolveTabsFallbackValue(vector.items)).toBe(vector.expected ?? undefined);
  });

  it.each(vectors.resolveTabsActiveValue)(
    'resolveTabsActiveValue($modelValue, $internalValue, …) -> $expected',
    (vector) => {
      const input = vector as {
        modelValue?: string | null;
        internalValue?: string;
        items: VfTabsItemLike[];
        expected: string | null;
      };

      expect(resolveTabsActiveValue(input.modelValue, input.internalValue, input.items)).toBe(
        input.expected ?? undefined,
      );
    },
  );

  it.each(vectors.resolveTabsActiveIndex)('resolveTabsActiveIndex(…, $activeValue) -> $expected', (vector) => {
    const input = vector as { items: VfTabsItemLike[]; activeValue?: string; expected: number };

    expect(resolveTabsActiveIndex(input.items, input.activeValue)).toBe(input.expected);
  });

  it.each(vectors.isTabsItemSelected)('isTabsItemSelected($activeValue, $item) -> $expected', (vector) => {
    const input = vector as { activeValue?: string; item: VfTabsItemLike; expected: boolean };

    expect(isTabsItemSelected(input.activeValue, input.item)).toBe(input.expected);
  });

  it.each(vectors.resolveTabsTabIndex)('resolveTabsTabIndex($activeValue, $item) -> $expected', (vector) => {
    const input = vector as { activeValue?: string; item: VfTabsItemLike; expected: number };

    expect(resolveTabsTabIndex(input.activeValue, input.item)).toBe(input.expected);
  });

  it.each(vectors.resolveTabsTabId)('resolveTabsTabId($baseId, $item) -> $expected', (vector) => {
    expect(resolveTabsTabId(vector.baseId, vector.item)).toBe(vector.expected);
  });

  it.each(vectors.resolveTabsPanelId)('resolveTabsPanelId($baseId, $item) -> $expected', (vector) => {
    expect(resolveTabsPanelId(vector.baseId, vector.item)).toBe(vector.expected);
  });

  it.each(vectors.resolveTabsControlledPanelId)(
    'resolveTabsControlledPanelId($baseId, $item, $hasPanelSlot) -> $expected',
    (vector) => {
      expect(resolveTabsControlledPanelId(vector.baseId, vector.item, vector.hasPanelSlot)).toBe(
        vector.expected ?? undefined,
      );
    },
  );

  it.each(vectors.resolveTabsNavigationTarget)(
    'resolveTabsNavigationTarget(…, $currentValue, $key, $isRtl) -> $expected',
    (vector) => {
      const target = resolveTabsNavigationTarget(vector.items, vector.currentValue, vector.key, vector.isRtl);

      expect(target?.value ?? null).toBe(vector.expected);
    },
  );

  it('returns the item itself from the ring, so a duplicated origin moves on from its first occurrence', () => {
    const items = [{ value: 'a' }, { value: 'a' }, { value: 'b' }];

    expect(resolveTabsNavigationTarget(items, 'a', 'ArrowRight', false)).toBe(items[1]);
    expect(resolveTabsNavigationTarget(items, 'b', 'ArrowRight', false)).toBe(items[0]);
  });

  it.each(vectors.resolveTabsIndicatorStyle)('resolveTabsIndicatorStyle($measurement) -> $expected', (vector) => {
    expect(resolveTabsIndicatorStyle(vector.measurement as VfTabsIndicatorMeasurement | null)).toEqual(vector.expected);
  });

  it('never rounds: the declaration carries the measured fraction as JavaScript writes it', () => {
    const [, transform, width] = resolveTabsIndicatorStyle({
      listLeft: 0,
      listClientWidth: 1000,
      tabLeft: 1 / 3,
      tabWidth: 2 / 3,
      insetStart: 0,
      insetEnd: 0,
    });

    expect(transform).toEqual(['transform', 'translateX(0.3333333333333333px)']);
    // (1/3 + 2/3) - 1/3 in doubles, written as JavaScript writes it.
    expect(width).toEqual(['width', '0.6666666666666667px']);
  });

  it.each(vectors.resolveTabsScrollerState)('resolveTabsScrollerState($measurement) -> $expected', (vector) => {
    expect(resolveTabsScrollerState(vector.measurement as VfTabsScrollerMeasurement)).toEqual(vector.expected);
  });

  it.each(vectors.resolveTabsScrollerStep)('resolveTabsScrollerStep($clientWidth) -> $expected', (vector) => {
    expect(resolveTabsScrollerStep(vector.clientWidth)).toBe(vector.expected);
  });
});
