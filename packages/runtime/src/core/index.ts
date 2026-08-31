/**
 * Framework-free component logic shared by every adapter.
 *
 * Nothing in here touches the DOM, so it is safe to import during server rendering and from a
 * framework component that owns its own markup.
 */
export { nextAccordionItem, resolveAccordionOpenItems, toggleAccordionItem } from './accordion.js';
export type { CmAccordionCoreItem } from './accordion.js';
export {
  ariaSortFor,
  clampPage,
  resolveColumnChooserState,
  resolveVisibleColumns,
  toggleAllColumns,
  toggleColumnVisibility,
  formatTemplate,
  nextSortState,
  resolveSelectionState,
  sortLabelFor,
  toggleAllSelection,
} from './data-table.js';
export type {
  CmDataTableSelectionState,
  CmDataTableSortDirection,
  CmDataTableSortLabel,
  CmDataTableSortState,
} from './data-table.js';
export {
  buildCalendarMonth,
  formatDisplayDate,
  formatIsoDate,
  monthLabel,
  parseIsoDate,
  shiftMonth,
  weekdayLabels,
} from './date-picker.js';
export type { CmCalendarDay } from './date-picker.js';
export { commandPaletteKeyAction, filterCommands, normalizeCommandQuery } from './command-palette.js';
export type { CmCommandCoreItem, CmCommandPaletteAction } from './command-palette.js';
export {
  cmFocusableSelector,
  cmTooltipDelays,
  dropdownKeyAction,
  popoverKeyAction,
  resolveDisclosureOpen,
  resolveTooltipDelay,
} from './disclosure.js';
export type { CmDisclosureAction, CmDisclosureFocus, CmDisclosureState, CmTooltipDelay } from './disclosure.js';
export { isInputClearVisible, resolveInputClearable, resolvePasswordReveal } from './input.js';
export type { CmPasswordRevealLabels, CmPasswordRevealState } from './input.js';
export { isMenuCloseKey, menuTabStopId, nextMenuItem } from './menu.js';
export type { CmMenuCoreItem } from './menu.js';
export { nextRovingIndex } from './roving.js';
export type { CmRovingDirection, CmRovingOptions, CmRovingOrientation } from './roving.js';
export { selectClosedKeyAction, selectOpenKeyAction } from './select.js';
export type { CmSelectAction, CmSelectFocusTarget } from './select.js';
export { nextTabsValue, resolveTabsValue } from './tabs.js';
export type { CmTabsCoreItem, CmTabsDirection } from './tabs.js';
