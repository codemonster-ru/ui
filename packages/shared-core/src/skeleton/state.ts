// Platform-independent presentation rules for VfSkeleton.
//
// Its own file rather than another export inside presentation/state.ts. That
// file exists because VfBadge, VfTag and VfDivider arrived together in M15, and
// growing it every time a milestone ships would turn "presentation" into a bag
// with no membership rule - which is the PresentationState expansion the M16
// plan forbids in section 13. VfSkeleton shares no rule with a toned span.
//
// These record the behaviour of the reference implementation at
// fd793696f50d3be0fcd3788f0f8f751c63869963, including the parts that are
// surprising. Historical quirks are the contract, not defects to normalise.

/** One CSS declaration, as the name/value pair both adapters write. */
export type VfSkeletonDeclaration = readonly [property: string, value: string];

/**
 * The skeleton root class list, in the order the reference emits it.
 *
 * `animated` defaults to true, so the modifier is present unless a caller
 * switches it off - the opposite polarity to every modifier migrated so far,
 * where the default state is the one that emits nothing.
 */
export function resolveSkeletonClasses(animated: boolean): string[] {
  const classes = ['vf-skeleton'];

  if (animated) classes.push('vf-skeleton--animated');

  return classes;
}

/**
 * A `minHeight` prop as a CSS length.
 *
 * A number becomes pixels; a string is passed through untouched, so
 * `'3rem'`, `'50%'` and `'var(--x)'` all reach the style attribute verbatim.
 * `0` is a number like any other and becomes `0px` rather than being dropped.
 */
export function resolveSkeletonLength(value: string | number | null | undefined): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  return typeof value === 'number' ? `${value}px` : value;
}

/**
 * The declarations the component itself writes into the root style attribute.
 *
 * Two quirks are pinned here rather than corrected:
 *
 *   - an empty string is dropped. Vue omits a style property whose value is
 *     `''`, so `radius: ''` does not mean "no rounding", it means "no
 *     border-radius declaration at all", and a skeleton with an empty radius
 *     and no minHeight carries no style attribute whatsoever;
 *   - `border-radius` is always written otherwise, including at the default,
 *     because the default is a token string rather than `undefined`.
 */
export function resolveSkeletonStyle(
  minHeight: string | number | null | undefined,
  radius: string | null | undefined,
): VfSkeletonDeclaration[] {
  const declarations: VfSkeletonDeclaration[] = [];
  const length = resolveSkeletonLength(minHeight);

  if (length !== undefined && length !== '') declarations.push(['min-height', length]);
  if (radius !== undefined && radius !== null && radius !== '') declarations.push(['border-radius', radius]);

  return declarations;
}
