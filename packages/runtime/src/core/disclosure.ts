/**
 * Rules shared by the components that show and hide a panel: Popover, Dropdown, Dialog, Drawer and
 * Tooltip.
 *
 * Each adapter still performs its own DOM work — focus, hidden, classes — but what a key means and
 * whether a panel may open at all is decided once, here.
 */

/**
 * The elements a panel will hand initial focus to.
 *
 * This was written out separately in each adapter and the two had already diverged: the Vue copy
 * omitted `select` and `textarea`, so a panel opening onto either focused nothing there while the
 * progressive-enhancement adapter focused it.
 */
export const cmFocusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Where a newly opened panel should place focus. */
export type CmDisclosureFocus = 'none' | 'first' | 'last';

export type CmDisclosureAction =
  | { readonly restoreFocus: boolean; readonly type: 'close' }
  | { readonly focus: CmDisclosureFocus; readonly type: 'open' };

export interface CmDisclosureState {
  readonly disabled?: boolean;
  /** Whether the event originated on the trigger rather than inside the panel. */
  readonly onTrigger?: boolean;
  readonly open: boolean;
}

/** A disabled disclosure is always closed, whatever was requested. */
export function resolveDisclosureOpen(requested: boolean, disabled = false): boolean {
  return requested && !disabled;
}

/**
 * Resolves what a key does to a popover: Escape closes it and returns focus to the trigger;
 * ArrowDown on the trigger opens it and moves focus into the panel.
 */
export function popoverKeyAction(key: string, state: CmDisclosureState): CmDisclosureAction | null {
  if (key === 'Escape' && state.open) {
    return { restoreFocus: true, type: 'close' };
  }

  if (key === 'ArrowDown' && state.onTrigger === true && state.disabled !== true) {
    return { focus: 'first', type: 'open' };
  }

  return null;
}

/**
 * Resolves what a key does to a dropdown. Enter, Space and ArrowDown open it at the first item;
 * ArrowUp opens it at the last. Escape closes it and returns focus to the trigger.
 */
export function dropdownKeyAction(key: string, state: CmDisclosureState): CmDisclosureAction | null {
  if (key === 'Escape' && state.open) {
    return { restoreFocus: true, type: 'close' };
  }

  if (state.onTrigger !== true || state.disabled === true) {
    return null;
  }

  if (key === 'ArrowUp') {
    return { focus: 'last', type: 'open' };
  }

  if (key === 'ArrowDown' || key === 'Enter' || key === ' ') {
    return { focus: 'first', type: 'open' };
  }

  return null;
}

export type CmTooltipDelay = 'none' | 'short' | 'long';

/** Tooltip open delays in milliseconds, named so both adapters cannot drift apart on the numbers. */
export const cmTooltipDelays = Object.freeze({ long: 700, none: 0, short: 300 });

export function resolveTooltipDelay(delay: CmTooltipDelay): number {
  return cmTooltipDelays[delay] ?? cmTooltipDelays.short;
}
