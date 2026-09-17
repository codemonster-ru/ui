// Platform-independent decision rules for VfBreadcrumbs.
//
// Three rules about *items*, and deliberately nothing about links. What a
// breadcrumb link is made of - href, target and the one rel derivation - is
// VfLink's rule already, and VfBreadcrumbs derives its rel through the same
// `resolveLinkRel` rather than restating it: the reference's inline function
// was byte-for-byte the same test. What is this component's own is deciding,
// per item, whether it is the current one, whether it is a link at all, and
// which classes the non-link span carries. The Vue adapter's other branch -
// resolving a component by name when an item has `to`, handing the
// destination through untouched, the literal unresolved element Vue renders
// with no router registered - is Vue's, lives in the Vue adapter, and has no
// rule here to mirror.
//
// Two of these rules are the ones a migration would "fix" by accident, and
// the vectors pin them as the reference has them:
//
//   - `current` on any item makes the explicit flags the rule; with none, the
//     last item is current. Two flags make two current items, and an explicit
//     `false` is the same as no flag;
//   - the link test is truthiness: an empty-string destination is no
//     destination, and the item is a span. VfLink keeps `href=""` on its
//     anchor; this component does not, and the two are not made to agree.
//
// These record the behaviour of the reference implementation at
// fd793696f50d3be0fcd3788f0f8f751c63869963.

/**
 * Which items are current, in order.
 *
 * `flags` is each item's explicit `current`, present or not. If any is true,
 * exactly those items are current - however many there are. If none is, the
 * last item is current and no other. An empty list has no current item.
 */
export function resolveBreadcrumbCurrentFlags(flags: ReadonlyArray<boolean | undefined | null>): boolean[] {
  const hasExplicitCurrent = flags.some((flag) => flag === true);

  return flags.map((flag, index) => flag === true || (!hasExplicitCurrent && index === flags.length - 1));
}

/**
 * Whether an item renders as a link.
 *
 * Not when it is disabled, not when it is current, and only when it has a
 * destination - tested for truthiness, as the reference tests `href || to`:
 * an empty string is no destination. The current item's destination is
 * dropped rather than rendered as a link that is also current.
 */
export function isBreadcrumbLink(
  disabled: boolean | undefined | null,
  current: boolean,
  destination: string | Record<string, unknown> | undefined | null,
): boolean {
  return !disabled && !current && Boolean(destination);
}

/**
 * The class list of an item that is not a link, in the order the reference
 * emits it: the block element, then the disabled modifier. The name is the
 * reference's: a disabled or destination-less item that is not current still
 * carries `vf-breadcrumbs__current`.
 */
export function resolveBreadcrumbItemClasses(disabled: boolean | undefined | null): string[] {
  const classes = ['vf-breadcrumbs__current'];

  if (disabled) classes.push('vf-breadcrumbs__current--disabled');

  return classes;
}
