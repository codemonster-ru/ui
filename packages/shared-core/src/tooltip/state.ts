// Platform-independent rules for VfTooltip.
//
// Every rule here is a decision the reference makes from values alone, and
// that more than one adapter has to make identically: the Vue component, the
// Razor server component and the Razor browser controller. What the component
// *does* - the four wrapper listeners, the one open timer, floater.js, the
// transition, the teleport - is runtime and stays in each adapter. So does the
// state machine itself: two listeners clear the timer and start a fresh one,
// two clear it and close; there is no value-to-value decision in it to share.
//
// Three of these read like VfPopover's - the arrow offset, the teleport
// resolution and the fixed strategy - and are deliberately not imported from
// popover/state.ts, for the reason popover/state.ts gives about the dropdown:
// the reference writes each SFC its own copy, so a change to one component's
// rule has never reached the other. The tooltip's own rules differ where the
// components differ: a top/bottom flip pair for every placement, a `--bottom`
// modifier beside `--top` on both the tooltip and the arrow and neither for any
// other computed placement, and a description relationship that follows the
// open state alone.
//
// These record the behaviour of the reference implementation at
// fd793696f50d3be0fcd3788f0f8f751c63869963.

/** The default `openDelay`: milliseconds between an activation and the open. */
export const TOOLTIP_OPEN_DELAY = 80;

/** The gap floater.js's offset middleware puts between trigger and tooltip. */
export const TOOLTIP_OFFSET = 10;

/** The positioning strategy: the tooltip is `position: fixed` in its stylesheet too. */
export const TOOLTIP_STRATEGY = 'fixed';

/** The two placements flip may choose between, whatever placement was requested. */
export const TOOLTIP_FLIP_PLACEMENTS: readonly string[] = ['top', 'bottom'];

/**
 * The tooltip's class list: the block, and a modifier for the *computed* side
 * - `--bottom` or `--top` - or none for any other computed placement.
 */
export function resolveTooltipContentClasses(placement: string): string[] {
  return [
    'vf-tooltip__content',
    ...(placement.startsWith('bottom') ? ['vf-tooltip__content--bottom'] : []),
    ...(placement.startsWith('top') ? ['vf-tooltip__content--top'] : []),
  ];
}

/** The arrow's class list: the same two conditional modifiers, not a two-way choice. */
export function resolveTooltipArrowClasses(placement: string): string[] {
  return [
    'vf-tooltip__arrow',
    ...(placement.startsWith('bottom') ? ['vf-tooltip__arrow--bottom'] : []),
    ...(placement.startsWith('top') ? ['vf-tooltip__arrow--top'] : []),
  ];
}

/**
 * The arrow's offset inside the tooltip, from floater.js's arrow middleware
 * data: the arrow position minus the tooltip position, 0 on an axis where
 * either number is missing.
 */
export function resolveTooltipArrowOffset(
  data: { x?: number; y?: number; baseX?: number; baseY?: number } | undefined | null,
): { x: number; y: number } {
  return {
    x: data?.x !== undefined && data?.baseX !== undefined ? data.x - data.baseX : 0,
    y: data?.y !== undefined && data?.baseY !== undefined ? data.y - data.baseY : 0,
  };
}

/**
 * Where the tooltip is teleported, or that it is not.
 *
 * `disableTeleport`, `false` and `null` render it in place. A string is a
 * selector; anything else that is not an element - `undefined` and `true`
 * included - means `body`. The element case is the Vue adapter's own.
 */
export function resolveTooltipTeleport<T>(
  teleportTo: string | T | null | boolean | undefined,
  disableTeleport: boolean,
  isElement: (value: unknown) => value is T = (_value): _value is T => false,
): { disabled: boolean; target: string | T } {
  const disabled = disableTeleport || teleportTo === false || teleportTo === null;

  if (typeof teleportTo === 'string') return { disabled, target: teleportTo };
  if (isElement(teleportTo)) return { disabled, target: teleportTo };

  return { disabled, target: 'body' };
}

/**
 * Whether an open tooltip renders its element: JavaScript truthiness of the
 * text, or the presence of a content slot. An empty text is no text; a
 * whitespace-only text and "0" are text. The slot wins over the text in what
 * renders, which is the template's business, not this rule's.
 */
export function resolveTooltipHasContent(text: string | null | undefined, hasContentSlot: boolean): boolean {
  return Boolean(text) || hasContentSlot;
}

/**
 * The trigger wrapper's `aria-describedby`: the tooltip id while open, nothing
 * while closed or pending. It follows the open state alone - an open tooltip
 * with no content still names the id it would have, and the reference dangles.
 */
export function resolveTooltipDescribedBy(open: boolean, id: string): string | undefined {
  return open ? id : undefined;
}
