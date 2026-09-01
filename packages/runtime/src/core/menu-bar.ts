/**
 * Menu bar keyboard rules, with no DOM and no framework.
 *
 * A menu bar is not one roving list. The same arrow means different things depending on where the
 * focus sits: along the bar it walks top-level items, inside a submenu it walks entries, and
 * whether an item is a branch decides whether it opens instead of moving. The old component spelled
 * that out across fifty lines of nested conditions; stating it as one function makes the rules
 * legible and testable without a DOM.
 */

export type CmMenuBarDirection = 'ltr' | 'rtl';

export interface CmMenuBarContext {
  /** Whether the focused item has children. */
  readonly isBranch: boolean;
  /** Whether the focused item's submenu is already open. */
  readonly isOpen: boolean;
  /** Whether focus sits on the bar rather than inside a submenu. */
  readonly isTopLevel: boolean;
  readonly direction?: CmMenuBarDirection;
}

export type CmMenuBarAction =
  /** Open the focused branch and move focus to its first or last entry. */
  | { readonly focus: 'first' | 'last'; readonly type: 'open' }
  /** Close the focused branch, leaving focus where it is. */
  | { readonly type: 'collapse' }
  /** Close the current submenu and return focus to the branch that opened it. */
  | { readonly type: 'close-to-parent' }
  /** Move within the current submenu. */
  | { readonly delta: -1 | 1; readonly type: 'focus-sibling' }
  /** Move along the bar. */
  | { readonly delta: -1 | 1; readonly type: 'move-top-level' }
  /** Jump within the current level. */
  | { readonly edge: 'first' | 'last'; readonly type: 'focus-edge' }
  /** Close everything and return focus to the bar. */
  | { readonly type: 'close-all' };

/**
 * Resolves what a key does, or `null` when the menu bar leaves the key alone.
 *
 * The horizontal arrows swap under `rtl`, because "next along the bar" follows the reading
 * direction. The vertical ones do not: a submenu drops downward in both.
 */
export function menuBarKeyAction(key: string, context: CmMenuBarContext): CmMenuBarAction | null {
  const rtl = context.direction === 'rtl';
  const openKey = rtl ? 'ArrowLeft' : 'ArrowRight';
  const closeKey = rtl ? 'ArrowRight' : 'ArrowLeft';

  if (key === 'Escape') {
    return { type: 'close-all' };
  }

  if (key === 'Home' || key === 'End') {
    return { edge: key === 'Home' ? 'first' : 'last', type: 'focus-edge' };
  }

  if (key === 'ArrowDown' || key === 'ArrowUp') {
    if (context.isTopLevel && context.isBranch) {
      return { focus: key === 'ArrowDown' ? 'first' : 'last', type: 'open' };
    }
    return { delta: key === 'ArrowDown' ? 1 : -1, type: 'focus-sibling' };
  }

  if (key === openKey) {
    if (!context.isTopLevel && context.isBranch) {
      return { focus: 'first', type: 'open' };
    }
    return { delta: 1, type: 'move-top-level' };
  }

  if (key === closeKey) {
    if (context.isTopLevel) {
      return { delta: -1, type: 'move-top-level' };
    }
    return { type: 'close-to-parent' };
  }

  if ((key === 'Enter' || key === ' ') && context.isBranch) {
    return context.isOpen ? { type: 'collapse' } : { focus: 'first', type: 'open' };
  }

  return null;
}
