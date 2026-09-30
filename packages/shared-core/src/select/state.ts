// Platform-independent rules for VfSelect.
//
// Every rule here is a decision the reference makes from values alone, and
// that more than one adapter has to make identically: the Vue component, the
// Razor server component and the Razor browser controller. What the component
// *does* - owning a listbox, moving focus, listening to the document, running
// the escape stack, calling floater.js, animating, teleporting, reporting to a
// field - is runtime and stays in each adapter.
//
// Several of these read like VfDropdown's - the flip pair, the walk, the
// teleport resolution - and are deliberately not imported from
// dropdown/state.ts. The reference writes them in each SFC, so a change to one
// component's rule has never reached the other, and the two already differ:
// the select's offset is 2, not 10, ArrowUp opens it, its menu has no variant,
// and its walk runs over the enabled options only, because a disabled option
// is not an item at all (`[role="option"]:not(:disabled)`).
//
// These record the behaviour of the reference implementation at
// fd793696f50d3be0fcd3788f0f8f751c63869963.

/** The gap floater.js's offset middleware puts between trigger and listbox. */
export const SELECT_OFFSET = 2;

/** The positioning strategy: the listbox is `position: fixed` in its stylesheet too. */
export const SELECT_STRATEGY = 'fixed';

/** The keys that open a select from its trigger. Home, End, Escape and Tab are not among them. */
export const SELECT_TRIGGER_OPEN_KEYS: readonly string[] = ['ArrowDown', 'ArrowUp', 'Enter', ' '];

/** The room kept above or below an option scrolled into view. */
export const SELECT_SCROLL_PADDING = 8;

export interface VfSelectOptionLike {
  value: string;
  label: string;
  disabled?: boolean;
}

/** Whether the model holds a value: its string form is not empty. An option with value '' is selected but not filled. */
export function resolveSelectHasValue(modelValue: unknown): boolean {
  return String(modelValue ?? '').length > 0;
}

/** The option the model selects: the first whose value equals it, disabled or not. */
export function resolveSelectSelectedOption<T extends VfSelectOptionLike>(
  options: readonly T[],
  modelValue: unknown,
): T | undefined {
  return options.find((option) => option.value === modelValue);
}

/**
 * The trigger's text: the selected label, else nothing under a floating label,
 * else the placeholder, else nothing.
 */
export function resolveSelectDisplayLabel(
  selectedLabel: string | undefined,
  floating: boolean,
  placeholder: string | undefined,
): string {
  if (selectedLabel !== undefined) return selectedLabel;
  if (floating) return '';

  return placeholder ?? '';
}

/** Whether the clear button renders: clearable, filled and enabled. The chevron renders exactly when it does not. */
export function resolveSelectHasClearControl(clearable: boolean, hasValue: boolean, disabled: boolean): boolean {
  return clearable && hasValue && !disabled;
}

/** Whether the hidden form input renders: only for a string `name`. */
export function resolveSelectRendersHiddenInput(name: unknown): name is string {
  return typeof name === 'string';
}

/**
 * Whether a consumer attribute is forwarded to the trigger. Only aria-*,
 * data-*, title and tabindex are; `class` and `style` go to the wrapper, a
 * string `id` becomes the trigger id, a string `name` the hidden input's, and
 * everything else - required, autofocus, form, role, listeners - is dropped.
 */
export function resolveSelectForwardsAttribute(name: string): boolean {
  return name.startsWith('aria-') || name.startsWith('data-') || name === 'title' || name === 'tabindex';
}

export interface VfSelectClassState {
  size: string;
  hasLeading: boolean;
  hasTrailing: boolean;
  hasClear: boolean;
  floating: boolean;
}

/** The wrapper's class list, before any consumer class. */
export function resolveSelectWrapperClasses(state: VfSelectClassState): string[] {
  const classes = ['vf-select-wrap'];

  if (state.size !== 'md') classes.push(`vf-select-wrap--${state.size}`);
  if (state.hasLeading) classes.push('vf-select-wrap--with-leading');
  if (state.hasTrailing) classes.push('vf-select-wrap--with-trailing');
  if (state.hasClear) classes.push('vf-select-wrap--with-clear');
  if (state.floating) classes.push('vf-select-wrap--floating');

  return classes;
}

/**
 * The trigger's class list. `--placeholder` needs no selected option *and* a
 * truthy placeholder - it is written under a floating label too, where the
 * placeholder text itself is suppressed.
 */
export function resolveSelectTriggerClasses(
  state: VfSelectClassState & { invalid: boolean; open: boolean; hasSelection: boolean; placeholder?: string },
): string[] {
  const classes = ['vf-select'];

  if (state.size !== 'md') classes.push(`vf-select--${state.size}`);
  if (state.invalid) classes.push('vf-select--invalid');
  if (state.open) classes.push('vf-select--open');
  if (!state.hasSelection && state.placeholder) classes.push('vf-select--placeholder');
  if (state.hasLeading) classes.push('vf-select--with-leading');
  if (state.hasTrailing) classes.push('vf-select--with-trailing');
  if (state.hasClear) classes.push('vf-select--with-clear');
  if (state.floating) classes.push('vf-select--floating');

  return classes;
}

/** The listbox's class list: the dropdown menu block, the select block, and `--top` for a computed top placement. */
export function resolveSelectMenuClasses(placement: string): string[] {
  const classes = ['vf-dropdown__menu', 'vf-select__menu'];

  if (placement.startsWith('top')) classes.push('vf-dropdown__menu--top');

  return classes;
}

/** The two placements flip may choose between: the end pair for `bottom-end`, the start pair otherwise. */
export function resolveSelectFlipPlacements(placement: string): [string, string] {
  return placement === 'bottom-end' ? ['bottom-end', 'top-end'] : ['bottom-start', 'top-start'];
}

/**
 * Where the listbox is teleported, or that it is not. `disableTeleport`,
 * `false` and `null` render it in place; a string is a selector; anything else
 * means `body`. The element case is the Vue adapter's own.
 */
export function resolveSelectTeleport<T>(
  teleportTo: string | T | null | false | undefined,
  disableTeleport: boolean,
  isElement: (value: unknown) => value is T = (_value): _value is T => false,
): { disabled: boolean; target: string | T } {
  const disabled = disableTeleport || teleportTo === false || teleportTo === null;

  if (typeof teleportTo === 'string') return { disabled, target: teleportTo };
  if (isElement(teleportTo)) return { disabled, target: teleportTo };

  return { disabled, target: 'body' };
}

/**
 * The enabled option an open moves focus to and scrolls into view: the
 * selected one counted among enabled options, or the first when the selected
 * one is disabled, missing or absent.
 */
export function resolveSelectFocusIndex(options: readonly VfSelectOptionLike[], modelValue: unknown): number {
  const selectedIndex = options.filter((option) => !option.disabled).findIndex((option) => option.value === modelValue);

  return Math.max(selectedIndex, 0);
}

/**
 * The enabled option a key moves focus to inside the open listbox, or
 * undefined for a key the listbox leaves alone. `currentIndex` is -1 when
 * focus is on no option, so ArrowUp from there lands on the second to last.
 */
export function resolveSelectMenuNavigation(key: string, currentIndex: number, count: number): number | undefined {
  if (key === 'ArrowDown') return (currentIndex + 1 + count) % count;
  if (key === 'ArrowUp') return (currentIndex - 1 + count) % count;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;

  return undefined;
}

/** What a field wrapping the select is told: filled while it holds a value or is open. */
export function resolveSelectFieldFilled(hasValue: boolean, open: boolean): boolean {
  return hasValue || open;
}

/**
 * The listbox scroll that brings an option into view with the padding, or
 * undefined when it already fits. Above the view it goes to the option's top
 * less the padding, never below 0; below, to its bottom plus the padding.
 */
export function resolveSelectScrollTop(item: {
  top: number;
  height: number;
  scrollTop: number;
  clientHeight: number;
}): number | undefined {
  const bottom = item.top + item.height;

  if (item.top - SELECT_SCROLL_PADDING < item.scrollTop) return Math.max(item.top - SELECT_SCROLL_PADDING, 0);
  if (bottom + SELECT_SCROLL_PADDING > item.scrollTop + item.clientHeight) {
    return bottom - item.clientHeight + SELECT_SCROLL_PADDING;
  }

  return undefined;
}
