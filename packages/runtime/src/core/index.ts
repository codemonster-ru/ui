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
export { menuBarKeyAction } from './menu-bar.js';
export type { CmMenuBarAction, CmMenuBarContext, CmMenuBarDirection } from './menu-bar.js';
export { isMenuCloseKey, menuTabStopId, nextMenuItem } from './menu.js';
export type { CmMenuCoreItem } from './menu.js';
export { nextRovingIndex } from './roving.js';
export type { CmRovingDirection, CmRovingOptions, CmRovingOrientation } from './roving.js';
export {
  cmShellAttributes,
  resolveMobileToggleLabel,
  shellEscapeState,
  shouldEnterAdvance,
  toggleShellMobileSidebar,
  toggleShellSidebar,
} from './shell.js';
export type { CmSetupFocusTarget, CmShellState } from './shell.js';
export { selectClosedKeyAction, selectOpenKeyAction } from './select.js';
export { nextStepperValue, resolveStepperProgress, resolveStepperValue, resolveStepState } from './stepper.js';
export type { CmStepperCoreItem, CmStepperStepState } from './stepper.js';
export {
  needsScrollEnhancement,
  resolveAnchorTargetId,
  resolveHeadingLevel,
  resolveItemHref,
  resolveScrollTarget,
} from './table-of-contents.js';
export type { CmTableOfContentsCoreItem } from './table-of-contents.js';
export type { CmSelectAction, CmSelectFocusTarget } from './select.js';
export { nextTabsValue, resolveTabsValue } from './tabs.js';
export {
  collectAncestorValues,
  collectBranchValues,
  expandToActive,
  findSiblings,
  isBranch,
  toggleBranchValue,
} from './tree.js';
export type { CmTreeCoreItem } from './tree.js';
export type { CmTabsCoreItem, CmTabsDirection } from './tabs.js';
export {
  cmThemeAttribute,
  cmThemeCookieMaxAge,
  cmThemeCookieName,
  isCmThemeMode,
  nextCmThemeMode,
  readCmThemeCookie,
  resolveCmTheme,
  serializeCmThemeCookie,
} from './theme.js';
export type { CmResolvedTheme, CmThemeMode } from './theme.js';
