// Platform-independent rules for VfDropdown.
//
// Every rule here is a decision the reference makes from values alone, and
// that more than one adapter has to make identically: the Vue component, the
// Razor server component and the Razor browser controller. What the
// component *does* - owning a panel, moving focus, listening to the document,
// running the escape stack, calling floater.js, animating, teleporting - is
// runtime and stays in each adapter. In particular there is no floating rule
// beyond the two constants and the flip pair: the middleware is built from
// floater.js by whoever runs it, and a rule that pretended to compute a
// position would be a second, untested floating implementation.
//
// These record the behaviour of the reference implementation at
// fd793696f50d3be0fcd3788f0f8f751c63869963.

/** The gap floater.js's offset middleware puts between trigger and menu. */
export const DROPDOWN_OFFSET = 10;

/** The positioning strategy: the menu is `position: fixed` in its stylesheet too. */
export const DROPDOWN_STRATEGY = 'fixed';

/** The keys that open a dropdown from its trigger. ArrowUp, Home and End are not among them. */
export const DROPDOWN_TRIGGER_OPEN_KEYS: readonly string[] = ['ArrowDown', 'Enter', ' '];

/**
 * Whether the menu is open: never while disabled, whatever the disclosure says.
 *
 * The disclosure itself can be open under a disabled dropdown - `disabled` is
 * checked here, not written back - which is why re-enabling one whose setup
 * watch already closed it renders it closed, and why a controlled `open`
 * under `disabled` renders nothing.
 */
export function resolveDropdownOpen(disabled: boolean, open: boolean): boolean {
  return !disabled && open;
}

/**
 * The trigger wrapper's state attributes.
 *
 * `aria-disabled` is written only as "true" and otherwise omitted; the
 * reference never writes "false". `aria-expanded` is always written, "false"
 * included. A disabled trigger leaves the tab order.
 */
export function resolveDropdownTriggerState(
  disabled: boolean,
  open: boolean,
): { ariaDisabled: 'true' | undefined; ariaExpanded: 'true' | 'false'; tabindex: '0' | '-1' } {
  return {
    ariaDisabled: disabled ? 'true' : undefined,
    ariaExpanded: resolveDropdownOpen(disabled, open) ? 'true' : 'false',
    tabindex: disabled ? '-1' : '0',
  };
}

/**
 * The menu's class list: the block, the variant modifier, and `--top` when the
 * *computed* placement is on top.
 *
 * The variant is written through without validation - the reference renders
 * `vf-dropdown__menu--bogus` for a variant it does not know - and the
 * placement is whatever floater.js last returned, which is the requested one
 * until the first computation and the flipped one after it.
 */
export function resolveDropdownMenuClasses(variant: string, placement: string): string[] {
  const classes = ['vf-dropdown__menu', `vf-dropdown__menu--${variant}`];

  if (placement.startsWith('top')) classes.push('vf-dropdown__menu--top');

  return classes;
}

/** The arrow's class list: bottom unless the computed placement is on top. */
export function resolveDropdownArrowClasses(placement: string): string[] {
  return ['vf-dropdown__arrow', placement.startsWith('top') ? 'vf-dropdown__arrow--top' : 'vf-dropdown__arrow--bottom'];
}

/**
 * The two placements flip may choose between.
 *
 * Only `bottom-end` selects the end pair; every other placement - the other
 * public value and any string outside the type - selects the start pair.
 */
export function resolveDropdownFlipPlacements(placement: string): [string, string] {
  return placement === 'bottom-end' ? ['bottom-end', 'top-end'] : ['bottom-start', 'top-start'];
}

/**
 * The arrow's offset inside the menu, from floater.js's arrow middleware data.
 *
 * floater.js reports the arrow in the floating element's own coordinates plus
 * the element's position as `baseX`/`baseY`; the reference writes the
 * difference, and writes 0 on an axis where either number is missing.
 */
export function resolveDropdownArrowOffset(
  data: { x?: number; y?: number; baseX?: number; baseY?: number } | undefined | null,
): { x: number; y: number } {
  return {
    x: data?.x !== undefined && data?.baseX !== undefined ? data.x - data.baseX : 0,
    y: data?.y !== undefined && data?.baseY !== undefined ? data.y - data.baseY : 0,
  };
}

/**
 * Where the menu is teleported, or that it is not.
 *
 * `disableTeleport`, `false` and `null` render the menu in place. A string is
 * a selector; anything else that is not an element - `undefined` included -
 * means `body`. The element case is the Vue adapter's own: this rule returns
 * it untouched and no other adapter can pass one.
 */
export function resolveDropdownTeleport<T>(
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
 * The item a key moves focus to inside the open menu, or undefined for a key
 * the menu leaves alone.
 *
 * `currentIndex` is the index of the focused element among the menu items,
 * -1 when focus is on none of them. The arithmetic is the reference's, quirk
 * included: from -1, ArrowDown lands on the first item but ArrowUp lands on
 * the *second to last*, because it computes `(-1 - 1 + count) % count`. Items
 * are not filtered - a disabled one is a valid target, and whether it takes
 * focus is the browser's decision, not this rule's.
 */
export function resolveDropdownMenuNavigation(key: string, currentIndex: number, count: number): number | undefined {
  if (key === 'ArrowDown') return (currentIndex + 1 + count) % count;
  if (key === 'ArrowUp') return (currentIndex - 1 + count) % count;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;

  return undefined;
}
