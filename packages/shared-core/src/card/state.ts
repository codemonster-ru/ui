// Platform-independent presentation rules for VfCard.
//
// Its own file, and deliberately not a rule about surfaces in general. VfPanel
// is structurally the nearer neighbour any component in this repository has to
// VfCard - same root tag, same conditional header, a `title` prop with the same
// fallback heading - and it is not migrated in M16. A `resolveSurfaceRegions`
// taking a block name would be written today and reused for VfPanel tomorrow,
// and the moment that happens the evidence that the two were ever compared
// independently is gone. See section 6 of the M16 plan.
//
// These record the behaviour of the reference implementation at
// fd793696f50d3be0fcd3788f0f8f751c63869963.

/** Which of the card's three regions render, and whether the header shows its fallback heading. */
export interface VfCardRegions {
  /** The unclassed `<header>` element. */
  header: boolean;
  /** The `h3.vf-card__title` the header slot falls back to. */
  headerTitle: boolean;
  /** The `div.vf-card__body` wrapper. */
  body: boolean;
  /** The unclassed `<footer>` element. */
  footer: boolean;
}

/** The card root class list, in the order the reference emits it. */
export function resolveCardClasses(compact: boolean): string[] {
  const classes = ['vf-card'];

  if (compact) classes.push('vf-card--compact');

  return classes;
}

/**
 * Which regions a card renders.
 *
 * Five historical rules, none of them obvious from the rendered result:
 *
 *   - the header appears when there is a title *or* a header slot, and an empty
 *     string title is falsy, so `title=""` renders no header at all rather than
 *     an empty one;
 *   - the fallback `h3` is slot fallback content, so it disappears once a
 *     header slot renders something - even when a title was also passed. The
 *     title is then silently unused;
 *   - the header wrapper and the fallback heading are keyed on *different*
 *     things, which is the subtlest rule in M16. The wrapper asks whether a
 *     header slot was passed; the heading asks whether that slot produced
 *     content. A consumer writing `<template #header><b v-if="false"/></template>`
 *     therefore gets a header element *and* the fallback `h3` inside it, and if
 *     no title was passed that `h3` is empty. Keying both on the same question
 *     is the obvious simplification and changes what such a card renders;
 *   - the body wrapper is keyed on the *presence* of the default slot, not on
 *     what it contains, so a slot that renders nothing still produces an empty
 *     `div.vf-card__body`;
 *   - the footer is keyed the same way and has no prop at all.
 *
 * `headerSlotContent` is what Vue computes for free - a slot yielding only
 * comments, or nothing at all, counts as no content - and what the Razor
 * adapter has to decide for itself, because a Razor slot is already-rendered
 * markup rather than a vnode list.
 */
export function resolveCardRegions(input: {
  title?: string | null;
  hasHeaderSlot: boolean;
  headerSlotContent?: boolean;
  hasDefaultSlot: boolean;
  hasFooterSlot: boolean;
}): VfCardRegions {
  return {
    header: Boolean(input.title) || input.hasHeaderSlot,
    headerTitle: !(input.headerSlotContent ?? input.hasHeaderSlot),
    body: input.hasDefaultSlot,
    footer: input.hasFooterSlot,
  };
}
