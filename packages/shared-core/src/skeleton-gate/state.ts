// Platform-independent presentation rules for VfSkeletonGate.
//
// Its own file, like every component file beside it. VfSkeletonGate renders
// VfSkeleton, and the tempting shortcut is to let it reach into
// skeleton/state.ts for the length conversion the two happen to share. They are
// the same three lines today and they belong to different components: a change
// to how a skeleton reads `minHeight` would silently move where a *gate*
// reserves space. Two identical rules that may diverge are cheaper than one
// rule that owns two contracts.
//
// These record the behaviour of the reference implementation at
// fd793696f50d3be0fcd3788f0f8f751c63869963, including the parts that are
// surprising. Historical quirks are the contract, not defects to normalise.
//
// What is deliberately *not* here: which props the gate forwards to the child
// skeleton. That is two attributes in the Vue template and two array keys in
// the PHP renderer, and a shared rule reproducing it would be the "extract a
// rule to mirror a one-line expression" the M17 plan forbids in section 17. It
// is pinned by both characterization suites and by three-way parity instead.

/** One CSS declaration, as the name/value pair both adapters write. */
export type VfSkeletonGateDeclaration = readonly [property: string, value: string];

/**
 * A length prop as a CSS length.
 *
 * A number becomes pixels; a string passes through untouched. `null` and
 * `undefined` are absence; the empty string is not, and that distinction is the
 * whole of the reserve quirk below.
 */
export function resolveSkeletonGateLength(value: string | number | null | undefined): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  return typeof value === 'number' ? `${value}px` : value;
}

/**
 * The root's reserved height, from the three sources that can supply it.
 *
 * The precedence is measured height, then reserveHeight, then minHeight, and
 * two things about it are historical rather than obvious:
 *
 *   - the measured height applies only while the gate is *not* ready, so the
 *     moment content appears the root hands its height back to reserveHeight
 *     or minHeight;
 *   - the reserve check is `!= null` applied *after* the conversion, so
 *     `reserveHeight: 0` reserves `0px` - correct and easy to lose to a
 *     truthiness check - and `reserveHeight: ''` wins the contest and then
 *     evaporates in the serialiser, silently swallowing a `minHeight` that
 *     would otherwise have been written.
 *
 * `measuredContentHeight` is a post-mount browser measurement. A server-side
 * adapter has none and passes null, which is exactly the state the reference
 * is in during SSR and in its own first rendered frame.
 */
export function resolveSkeletonGateMinHeight(
  ready: boolean,
  minHeight: string | number | null | undefined,
  reserveHeight: string | number | null | undefined,
  preserveLastHeight: boolean,
  measuredContentHeight: number | null,
): string | undefined {
  if (preserveLastHeight && measuredContentHeight !== null && !ready) {
    return `${measuredContentHeight}px`;
  }

  const reserve = resolveSkeletonGateLength(reserveHeight);
  if (reserve !== undefined) {
    return reserve;
  }

  return resolveSkeletonGateLength(minHeight);
}

/**
 * The declarations the gate writes into its own root style attribute.
 *
 * The fade duration is written on every render, including at the default, so a
 * gate always carries a style attribute even when nothing else is set.
 *
 * An empty value is kept here rather than dropped, because the reference builds
 * a plain object and hands it to the platform's serialiser. On the client Vue
 * drops a style property whose value is `''`; under SSR it writes
 * `min-height:;`. Dropping it in this rule would be tidier and would silently
 * change the reference's server output, so the difference stays where the
 * reference put it - in the serialiser - and each adapter's own suite records
 * which form it produces.
 */
export function resolveSkeletonGateRootStyle(
  minHeight: string | undefined,
  radius: string | null | undefined,
  fadeDuration: number,
): VfSkeletonGateDeclaration[] {
  const declarations: VfSkeletonGateDeclaration[] = [];

  if (minHeight !== undefined) declarations.push(['min-height', minHeight]);
  if (radius !== undefined && radius !== null) declarations.push(['border-radius', radius]);
  declarations.push(['--vf-skeleton-gate-fade-duration', `${fadeDuration}ms`]);

  return declarations;
}

/**
 * The declarations the gate writes onto the overlay.
 *
 * The radius and nothing else: the overlay never receives the reserved height,
 * the min-height or the fade duration, even though the root receives all three.
 */
export function resolveSkeletonGateOverlayStyle(radius: string | null | undefined): VfSkeletonGateDeclaration[] {
  if (radius === undefined || radius === null) {
    return [];
  }

  return [['border-radius', radius]];
}

/**
 * The content wrapper's class list, in the order the reference emits it.
 *
 * The ready modifier is what the CSS fades on, and it is the only place the
 * ready state reaches the content wrapper's classes. Note that the wrapper is
 * rendered in both states: this is a modifier on a permanent element, not a
 * branch.
 */
export function resolveSkeletonGateContentClasses(ready: boolean, normalizeContentSpacing: boolean): string[] {
  const classes = ['vf-skeleton-gate__content'];

  if (ready) classes.push('vf-skeleton-gate__content--ready');
  if (normalizeContentSpacing) classes.push('vf-skeleton-gate__content--normalize-spacing');

  return classes;
}
