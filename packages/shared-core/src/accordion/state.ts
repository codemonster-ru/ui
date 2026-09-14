// Platform-independent rules for VfAccordion.
//
// Three rules, and a deliberate list of what is not here. VfAccordion is the
// first migrated component that owns state a user changes, and the tempting
// extraction is the state itself: an `AccordionState` or `DisclosureState`
// class with `toggle()`, `open()`, `close()` and a listener. That would be the
// generic state machine the M22 plan forbids, and it would be wrong on the
// merits: the Vue adapter's state lives in the `useDisclosure` composable it
// shares with the dialog, drawer and popover, and the Razor adapter's state
// lives in the server-rendered `aria-expanded` attribute its controller reads.
// Neither has a second copy to keep in sync, and a shared class would give
// both one.
//
// So what is shared is what is decided, not what is held:
//
//   - which initial state the props resolve to, which is the one decision a
//     server has to make before any script runs;
//   - the icon's class list in each state;
//   - the transition declaration the JavaScript hooks write inline.
//
// The enter and leave sequences themselves - which inline declarations are
// written in which order, and when they are cleared - are behaviour bound to a
// DOM element and a frame clock. They are reproduced in each adapter's own
// hooks and pinned by both characterization suites and by post-interaction
// convergence in the parity harness, not extracted into a map.
//
// These record the behaviour of the reference implementation at
// fd793696f50d3be0fcd3788f0f8f751c63869963.

/**
 * The open state the props resolve to before any interaction.
 *
 * `open` is the controlled prop and wins whenever it is defined; `defaultOpen`
 * seeds the uncontrolled state otherwise. This is the initial half of the
 * reference's `useDisclosure` composable, stated on its own because a server
 * renders exactly this half and nothing after it.
 *
 * `undefined` is the only absence. The Vue reference tests `!== undefined`, so
 * an explicit `null` is a controlled *closed* accordion there; a Razor
 * attribute of `null` is "nothing said" by that adapter's own convention and
 * is mapped to `undefined` before this rule sees it. That mapping is the
 * adapter's, and its tests own it.
 */
export function resolveAccordionOpen(open: boolean | undefined, defaultOpen: boolean | undefined): boolean {
  return open !== undefined ? Boolean(open) : Boolean(defaultOpen);
}

/** The icon wrapper's class list in the order the reference emits it. */
export function resolveAccordionIconClasses(open: boolean): string[] {
  const classes = ['vf-accordion__icon'];

  if (open) classes.push('vf-accordion__icon--open');

  return classes;
}

/**
 * The inline `transition` declaration both adapters write on the panel while
 * it enters or leaves.
 *
 * Two properties, height then opacity, each over the theme's normal duration
 * and standard easing through the custom properties rather than literal
 * values. The *timer* that ends the transition is not derived from this
 * string: each adapter reads the millisecond value from the theme package,
 * exactly as the reference does, and this rule stays free of that dependency.
 */
export function resolveAccordionTransition(): string {
  return [
    'height var(--vf-motion-duration-normal) var(--vf-motion-ease-standard)',
    'opacity var(--vf-motion-duration-normal) var(--vf-motion-ease-standard)',
  ].join(', ');
}
