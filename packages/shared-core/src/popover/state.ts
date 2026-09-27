// Platform-independent rules for VfPopover.
//
// Every rule here is a decision the reference makes from values alone, and
// that more than one adapter has to make identically: the Vue component, the
// Razor server component and the Razor browser controller. What the
// component *does* - owning a panel, moving focus, listening to the document,
// running the escape stack, calling floater.js, animating, teleporting - is
// runtime and stays in each adapter.
//
// Three of these read like VfDropdown's - the flip pair, the arrow offset and
// the teleport resolution - and are deliberately not imported from
// dropdown/state.ts. The reference writes them twice, once in each SFC, so a
// change to one component's rule has never reached the other; sharing them
// would make a dropdown decision a popover decision too. The popover's own
// rules differ where the components differ: no disabled state, no variant, no
// `--bottom` panel modifier, and a trigger that toggles.
//
// These record the behaviour of the reference implementation at
// fd793696f50d3be0fcd3788f0f8f751c63869963.

/** The gap floater.js's offset middleware puts between trigger and panel. */
export const POPOVER_OFFSET = 10;

/** The positioning strategy: the panel is `position: fixed` in its stylesheet too. */
export const POPOVER_STRATEGY = 'fixed';

/** What moves focus into an open panel, first match in document order; the panel itself otherwise. */
export const POPOVER_AUTOFOCUS_SELECTOR = '[autofocus], [data-autofocus]';

/**
 * What a key pressed on the trigger does: Enter and Space toggle, ArrowDown
 * opens - again, when already open - and every other key is left alone and
 * not prevented. ArrowUp, Home, End, Tab and Escape are among the others.
 */
export function resolvePopoverTriggerKey(key: string): 'toggle' | 'open' | undefined {
  if (key === 'Enter' || key === ' ') return 'toggle';
  if (key === 'ArrowDown') return 'open';

  return undefined;
}

/** The trigger's one state attribute. `aria-expanded` is always written, "false" included. */
export function resolvePopoverTriggerState(open: boolean): { ariaExpanded: 'true' | 'false' } {
  return { ariaExpanded: open ? 'true' : 'false' };
}

/**
 * The panel's class list: the block, and `--top` when the *computed* placement
 * is on top. There is no `--bottom` panel modifier.
 */
export function resolvePopoverContentClasses(placement: string): string[] {
  return placement.startsWith('top') ? ['vf-popover__content', 'vf-popover__content--top'] : ['vf-popover__content'];
}

/** The arrow's class list: bottom unless the computed placement is on top. */
export function resolvePopoverArrowClasses(placement: string): string[] {
  return ['vf-popover__arrow', placement.startsWith('top') ? 'vf-popover__arrow--top' : 'vf-popover__arrow--bottom'];
}

/** The two placements flip may choose between: the end pair for `bottom-end`, the start pair otherwise. */
export function resolvePopoverFlipPlacements(placement: string): [string, string] {
  return placement === 'bottom-end' ? ['bottom-end', 'top-end'] : ['bottom-start', 'top-start'];
}

/**
 * The arrow's offset inside the panel, from floater.js's arrow middleware
 * data: the arrow position minus the panel position, 0 on an axis where
 * either number is missing.
 */
export function resolvePopoverArrowOffset(
  data: { x?: number; y?: number; baseX?: number; baseY?: number } | undefined | null,
): { x: number; y: number } {
  return {
    x: data?.x !== undefined && data?.baseX !== undefined ? data.x - data.baseX : 0,
    y: data?.y !== undefined && data?.baseY !== undefined ? data.y - data.baseY : 0,
  };
}

/**
 * Where the panel is teleported, or that it is not.
 *
 * `disableTeleport`, `false` and `null` render the panel in place. A string is
 * a selector; anything else that is not an element - `undefined` included -
 * means `body`. The element case is the Vue adapter's own.
 */
export function resolvePopoverTeleport<T>(
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
 * Whether the popover's escape entry closes it. The entry is on the shared
 * stack whenever the popover is open, closeOnEscape or not: when this says
 * false the Escape is taken, left unprevented, and reaches no entry below.
 */
export function resolvePopoverClosesOnEscape(open: boolean, closeOnEscape: boolean): boolean {
  return open && closeOnEscape;
}

/** Whether a document click outside the trigger and the panel closes the popover. */
export function resolvePopoverClosesOnOutsideClick(open: boolean, closeOnOutsideClick: boolean): boolean {
  return open && closeOnOutsideClick;
}
