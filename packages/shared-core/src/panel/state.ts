// Platform-independent presentation rules for VfPanel.
//
// Its own file, and deliberately not a rule about surfaces in general. VfCard is
// the nearest structural neighbour this component has - same root tag, same
// conditional unclassed header, a `title` prop with the same fallback heading -
// and M16 refused to write a `resolveSurfaceRegions` taking a block name for
// exactly the reason M18 exists to test. The two are still not the same
// contract:
//
//   - `VfPanelRegions` has two fields where `VfCardRegions` has four. A panel
//     has no body wrapper and no footer at all, so a shared type would have to
//     carry two fields one component never reads - and the moment it did, an
//     implementation that grew a `div.vf-panel__body` would be answering a
//     question the rule already asked;
//   - the modifiers are different products, not different spellings. `compact`
//     changes a card's padding and column gap; `subtle` changes a panel's
//     background and removes its shadow. One `resolveTonedSurfaceClasses` would
//     make them interchangeable in the only place the difference is decided.
//
// So the header rule below is textually close to the card's and is owned here
// anyway. See section 7 of the M18 plan.
//
// These record the behaviour of the reference implementation at
// fd793696f50d3be0fcd3788f0f8f751c63869963.

/** Which of the panel's header parts render. Two fields, because a panel has two. */
export interface VfPanelRegions {
  /** The unclassed `<header>` element. */
  header: boolean;
  /** The `h3.vf-panel__title` the header slot falls back to. */
  headerTitle: boolean;
}

/** The panel root class list, in the order the reference emits it. */
export function resolvePanelClasses(subtle: boolean): string[] {
  const classes = ['vf-panel'];

  if (subtle) classes.push('vf-panel--subtle');

  return classes;
}

/**
 * Which header parts a panel renders.
 *
 * Three historical rules, and the absence of two more:
 *
 *   - the header appears when there is a title *or* a header slot, and an empty
 *     string title is falsy, so `title=""` renders no header at all rather than
 *     an empty one;
 *   - the fallback `h3` is slot fallback content, so it disappears once a
 *     header slot renders something - even when a title was also passed. The
 *     title is then silently unused;
 *   - the header wrapper and the fallback heading are keyed on *different*
 *     things. The wrapper asks whether a header slot was passed; the heading
 *     asks whether that slot produced content. A consumer writing
 *     `<template #header><b v-if="false"/></template>` therefore gets a header
 *     element *and* the fallback `h3` inside it, and with no title that `h3` is
 *     empty;
 *   - and the two that are not here: the default slot has no wrapper and no
 *     condition. It renders straight into the section, so there is nothing to
 *     decide about it and no `body` field to decide it with. A panel has no
 *     footer either, so there is no `footer` field. Those two absences are the
 *     structural difference from VfCard, stated where an implementation would
 *     otherwise be free to invent them.
 *
 * `headerSlotContent` is what Vue computes for free - a slot yielding only
 * comments, or nothing at all, counts as no content - and what the Razor
 * adapter has to decide for itself, because a Razor slot is already-rendered
 * markup rather than a vnode list.
 */
export function resolvePanelRegions(input: {
  title?: string | null;
  hasHeaderSlot: boolean;
  headerSlotContent?: boolean;
}): VfPanelRegions {
  return {
    header: Boolean(input.title) || input.hasHeaderSlot,
    headerTitle: !(input.headerSlotContent ?? input.hasHeaderSlot),
  };
}
