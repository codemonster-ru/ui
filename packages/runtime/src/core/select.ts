/**
 * Select keyboard rules, with no DOM and no framework.
 *
 * A select behaves as two different widgets depending on whether its listbox is open, so the rules
 * come in two functions rather than one with a mode flag.
 */

/** Where focus lands when the listbox opens. `selected` falls back to the first option. */
export type CmSelectFocusTarget = 'first' | 'last' | 'selected';

export type CmSelectAction =
  | { readonly type: 'close' }
  | { readonly focus: CmSelectFocusTarget; readonly type: 'open' }
  | { readonly index: number; readonly type: 'focus' }
  | { readonly index: number; readonly type: 'commit' };

/**
 * Resolves what a key does to a closed select.
 *
 * ArrowUp opens at the last option, everything else that opens starts from the current selection.
 */
export function selectClosedKeyAction(key: string): CmSelectAction | null {
  if (key === 'ArrowUp') {
    return { focus: 'last', type: 'open' };
  }

  if (key === 'ArrowDown' || key === 'Enter' || key === ' ') {
    return { focus: 'selected', type: 'open' };
  }

  return null;
}

/**
 * Resolves what a key does to an open select.
 *
 * Arrows wrap around, and from "nothing focused" both of them land on the first option rather than
 * wrapping to the end — an open listbox with no active option is a state you arrow *into*, not
 * one you navigate relative to.
 */
export function selectOpenKeyAction(
  key: string,
  { activeIndex, count }: { readonly activeIndex: number; readonly count: number },
): CmSelectAction | null {
  if (key === 'Escape') {
    return { type: 'close' };
  }

  if (count === 0) {
    return null;
  }

  if (key === 'ArrowDown' || key === 'ArrowUp') {
    const step = key === 'ArrowDown' ? 1 : -1;
    const index = activeIndex === -1 ? 0 : (activeIndex + step + count) % count;
    return { index, type: 'focus' };
  }

  if (key === 'Home') {
    return { index: 0, type: 'focus' };
  }

  if (key === 'End') {
    return { index: count - 1, type: 'focus' };
  }

  if ((key === 'Enter' || key === ' ') && activeIndex >= 0) {
    return { index: activeIndex, type: 'commit' };
  }

  return null;
}
