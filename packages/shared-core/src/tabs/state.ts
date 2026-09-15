// Platform-independent rules for VfTabs.
//
// What is shared is what is decided, not what is held - the line M23 drew for
// the stepper, drawn again for a component with more to decide. VfTabs owns a
// string selection, a roving tabindex that projects it, an id graph, a
// keyboard ring over the enabled items, an indicator whose geometry is
// measured off the DOM and an internal scroller whose state is read off the
// viewport. Every one of those is a pure calculation somewhere inside the
// reference, and every one of them is *surrounded* by something that is not:
// a ref, a DOM read, a listener, a timer, a focus call. The calculations are
// here; the surroundings stay in each adapter.
//
// So there is no `SelectionState`, no `RovingFocus`, no `TabsController` and
// no `ScrollerController`: nothing here holds a value, listens to anything,
// touches an element or knows what a frame is. The navigation rule takes a key
// name and returns an item; it does not know what focus is. The indicator rule
// takes six numbers and returns three declarations; it does not know what a
// rect is. The scroller rule takes four numbers and returns two booleans. The
// Vue adapter reads the DOM and calls them; the Razor controller reads the same
// DOM and calls the same functions; the PHP adapter mirrors the subset a
// server can decide - the selection projection and the ids - and none of the
// browser-only geometry.
//
// Reproduced, not corrected (see VfTabs.characterization.spec.ts):
//
//   - the roving tabindex is a projection of the value, not an invariant: an
//     unknown value leaves no tab at 0, a duplicated value leaves two;
//   - a `defaultValue` naming a disabled item stays selected;
//   - ids embed the raw value, spaces and duplicates included;
//   - ArrowDown and ArrowUp navigate a horizontal tablist;
//   - the indicator is computed in the LTR frame under RTL, unrounded;
//   - a scrollable edge needs more than one pixel.

export interface VfTabsItemLike {
  value: string;
  disabled?: boolean;
  tabId?: string;
  panelId?: string;
}

export type VfTabsDeclaration = [property: string, value: string];

/** The value of the first enabled item, or undefined when there is none. */
export function resolveTabsFallbackValue(items: readonly VfTabsItemLike[]): string | undefined {
  return items.find((item) => !item.disabled)?.value;
}

/**
 * The active value: the controlled prop, else the internal seed, else the
 * fallback - each tested with `??`, so an empty string is a value and null is
 * an absence. An unknown value is kept as-is; it matches no item, and the
 * projection below says what that renders as. The seed itself is
 * `defaultValue ?? fallback`, which the Vue adapter takes once at mount and
 * the Razor adapter takes at render, so a server hands this rule the same
 * two inputs a mounted component holds.
 */
export function resolveTabsActiveValue(
  modelValue: string | null | undefined,
  internalValue: string | undefined,
  items: readonly VfTabsItemLike[],
): string | undefined {
  return modelValue ?? internalValue ?? resolveTabsFallbackValue(items);
}

/** The index of the first item carrying the active value, or -1. */
export function resolveTabsActiveIndex(items: readonly VfTabsItemLike[], activeValue: string | undefined): number {
  return items.findIndex((item) => item.value === activeValue);
}

/**
 * Whether a tab is selected: its value equals the active value. Disabled is
 * not consulted, so a disabled seed stays selected; every occurrence of a
 * duplicated value is selected; nothing is selected for an unknown value.
 * `aria-selected` and `tabindex` are both projections of this one boolean.
 */
export function isTabsItemSelected(activeValue: string | undefined, item: VfTabsItemLike): boolean {
  return activeValue === item.value;
}

/** The roving tabindex: 0 on every selected tab, -1 elsewhere. */
export function resolveTabsTabIndex(activeValue: string | undefined, item: VfTabsItemLike): 0 | -1 {
  return isTabsItemSelected(activeValue, item) ? 0 : -1;
}

/** The tab's id: its own `tabId`, else `${baseId}-tab-${value}` with the raw value. */
export function resolveTabsTabId(baseId: string, item: VfTabsItemLike): string {
  return item.tabId ?? `${baseId}-tab-${item.value}`;
}

/** The panel's id: the item's own `panelId`, else `${baseId}-panel-${value}` with the raw value. */
export function resolveTabsPanelId(baseId: string, item: VfTabsItemLike): string {
  return item.panelId ?? `${baseId}-panel-${item.value}`;
}

/**
 * What a tab writes into aria-controls: the panel id whenever a panel slot
 * exists, and for an item with its own `panelId` even when none does;
 * otherwise nothing. Only the active panel is rendered, so with a panel slot
 * every inactive tab's reference dangles by design.
 */
export function resolveTabsControlledPanelId(
  baseId: string,
  item: VfTabsItemLike,
  hasPanelSlot: boolean,
): string | undefined {
  if (!hasPanelSlot && !item.panelId) {
    return undefined;
  }

  return resolveTabsPanelId(baseId, item);
}

/**
 * The keyboard ring, restated as a lookup.
 *
 * The navigation keys are ArrowRight/ArrowLeft *and* ArrowDown/ArrowUp - the
 * vertical pair navigates a horizontal tablist in the reference - plus Home
 * and End. Under RTL the horizontal pair swaps; the vertical pair never does.
 * The ring is the enabled items, the origin is the item that received the
 * key (found by value, so a duplicated value resolves to its first enabled
 * occurrence), and both arrows wrap. An origin outside the ring - a disabled
 * tab - or any other key returns undefined: not handled, nothing prevented.
 */
export function resolveTabsNavigationTarget(
  items: readonly VfTabsItemLike[],
  currentValue: string,
  key: string,
  isRtl: boolean,
): VfTabsItemLike | undefined {
  const enabledItems = items.filter((item) => !item.disabled);
  const currentIndex = enabledItems.findIndex((item) => item.value === currentValue);

  if (currentIndex === -1) {
    return undefined;
  }

  const movesForward = key === 'ArrowDown' || (isRtl ? key === 'ArrowLeft' : key === 'ArrowRight');
  const movesBackward = key === 'ArrowUp' || (isRtl ? key === 'ArrowRight' : key === 'ArrowLeft');

  if (movesForward) {
    return enabledItems[(currentIndex + 1) % enabledItems.length];
  }

  if (movesBackward) {
    return enabledItems[(currentIndex - 1 + enabledItems.length) % enabledItems.length];
  }

  if (key === 'Home') {
    return enabledItems[0];
  }

  if (key === 'End') {
    return enabledItems[enabledItems.length - 1];
  }

  return undefined;
}

/**
 * The measurements the indicator is computed from - numbers a browser read
 * off the DOM, never the elements themselves. `listLeft` and `tabLeft` are
 * client-rect lefts in the same frame; `insetStart` and `insetEnd` are the
 * offsetWidths of the scroll buttons *currently shown* (zero for a hidden
 * one), which is what clips the indicator under an overlaid button.
 */
export interface VfTabsIndicatorMeasurement {
  listLeft: number;
  listClientWidth: number;
  tabLeft: number;
  tabWidth: number;
  insetStart: number;
  insetEnd: number;
}

/** The seed the indicator holds before anything is measured and whenever no tab is active. */
export const TABS_INDICATOR_HIDDEN: readonly VfTabsDeclaration[] = [
  ['opacity', '0'],
  ['transform', 'translateX(0)'],
  ['width', '0'],
];

/**
 * The indicator's three inline declarations, in the order the reference
 * writes them.
 *
 * The tab's start is its offset inside the list in the LTR frame - under RTL
 * too, which is the reference's own arithmetic. The visible span is clipped
 * to the shown buttons; a span of zero width is hidden but keeps its offset,
 * so an active tab scrolled out of view reads `opacity: 0` with the offset
 * of the button that covers it. Nothing is rounded: Chrome measures tabs at
 * fractional widths and the reference writes them as they come.
 */
export function resolveTabsIndicatorStyle(measurement: VfTabsIndicatorMeasurement | null): VfTabsDeclaration[] {
  if (measurement === null) {
    return [...TABS_INDICATOR_HIDDEN];
  }

  const tabStart = measurement.tabLeft - measurement.listLeft;
  const tabEnd = tabStart + measurement.tabWidth;
  const visibleStart = Math.max(measurement.insetStart, tabStart);
  const visibleEnd = Math.min(measurement.listClientWidth - measurement.insetEnd, tabEnd);
  const visibleWidth = Math.max(0, visibleEnd - visibleStart);
  const isVisible = visibleWidth > 0;

  return [
    ['opacity', isVisible ? '1' : '0'],
    ['transform', `translateX(${visibleStart}px)`],
    ['width', `${visibleWidth}px`],
  ];
}

/** The four numbers the scroller reads off its viewport, plus the direction it resolved. */
export interface VfTabsScrollerMeasurement {
  scrollWidth: number;
  clientWidth: number;
  scrollLeft: number;
  isRtl: boolean;
}

export interface VfTabsScrollerState {
  canScrollLeft: boolean;
  canScrollRight: boolean;
}

/**
 * Whether the viewport can scroll each way.
 *
 * The offset is `scrollLeft` under LTR and the absolute value of its
 * non-positive part under RTL, where Chrome counts leftward scroll below zero.
 * Both edges need *more than one pixel* of travel: a single remaining pixel
 * is "cannot scroll", which is what keeps the buttons from flickering on a
 * fractional layout.
 */
export function resolveTabsScrollerState(measurement: VfTabsScrollerMeasurement): VfTabsScrollerState {
  const maxScrollLeft = measurement.scrollWidth - measurement.clientWidth;
  const scrollOffset = measurement.isRtl ? Math.abs(Math.min(measurement.scrollLeft, 0)) : measurement.scrollLeft;

  return {
    canScrollLeft: measurement.isRtl ? maxScrollLeft - scrollOffset > 1 : scrollOffset > 1,
    canScrollRight: measurement.isRtl ? scrollOffset > 1 : maxScrollLeft - scrollOffset > 1,
  };
}

/** How far one scroll button moves the viewport: 60% of its width, never less than 120px. */
export function resolveTabsScrollerStep(clientWidth: number, stepRatio = 0.6, minStep = 120): number {
  return Math.max(minStep, Math.round(clientWidth * stepRatio));
}
