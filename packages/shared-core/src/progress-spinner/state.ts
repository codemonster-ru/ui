// Platform-independent presentation rules for VfProgressSpinner.
//
// Its own file, and deliberately not a rule about "loading indicators" or
// "progress". VfProgressBar is the other progress component and shares the
// role name and nothing else - it has a value, a max, a determinate branch and
// a label element the spinner does not have. VfSkeleton is the other loading
// placeholder and shares nothing at all. A `loadingState` or `progressState`
// module that served all three would be a module with no membership rule.
//
// Two rules, and both are the reference's own:
//
//   - the tone rule suppresses the modifier at `primary`, the default, and
//     emits one for every other value - `neutral` included, and an unknown
//     tone included, because the reference interpolates the prop without
//     checking it against its own union. This is the alert's rule and not the
//     badge's, and it is restated here rather than imported from either: three
//     components agreeing on one line today is not a reason to make the fourth
//     depend on whichever one changes first;
//   - the size rule converts a number to pixels and passes a string through.
//     It is the same shape as the skeleton's length rule and is its own copy
//     for the reason the gate's is: two contracts that happen to agree remain
//     two contracts.
//
// There is no rule about the role, the label or the artwork, because none of
// them has a decision in it: every spinner writes `role="progressbar"`, its
// label prop verbatim, and the same two circles.
//
// These record the behaviour of the reference implementation at
// fd793696f50d3be0fcd3788f0f8f751c63869963.

/** One CSS declaration, as the name/value pair both adapters write. */
export type VfProgressSpinnerDeclaration = readonly [property: string, value: string];

/**
 * The spinner root class list, in the order the reference emits it.
 *
 * `primary` - the default - emits no modifier. Every other tone does, including
 * `neutral` and including a value outside the tone union.
 */
export function resolveProgressSpinnerClasses(tone: string): string[] {
  const classes = ['vf-progress-spinner'];

  if (tone !== 'primary') classes.push(`vf-progress-spinner--${tone}`);

  return classes;
}

/**
 * A `size` prop as a CSS length.
 *
 * A number becomes pixels; a string passes through untouched, which is how
 * `'2em'`, `'50%'` and `'var(--vf-icon-current-size)'` - the value VfButton
 * forwards - all reach the custom property verbatim. `0` is a number like any
 * other and becomes `0px`. Absent is absent.
 */
export function resolveProgressSpinnerSize(value: string | number | null | undefined): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  return typeof value === 'number' ? `${value}px` : value;
}

/**
 * The declarations the component itself writes into the root style attribute.
 *
 * One custom property, `--vf-progress-spinner-size`, and nothing else: the
 * colour, the duration and the easings are stylesheet tokens the component
 * never touches. Absent size, no declaration, so the token default applies.
 *
 * An empty string is *kept*, as `['--vf-progress-spinner-size', '']`, for the
 * reason the skeleton gate's rule keeps its empty min-height: the reference
 * builds a plain object and lets the platform serialiser decide. Vue's client
 * serialiser drops the property and writes no attribute; Vue's SSR serialiser
 * writes `--vf-progress-spinner-size:;`. Dropping it here would change the
 * server output of the Vue adapter, and that output is the reference's. The
 * Razor adapter drops it, as its own decision, because the client form is
 * what every browser ends up with once Vue hydrates.
 */
export function resolveProgressSpinnerStyle(size: string | number | null | undefined): VfProgressSpinnerDeclaration[] {
  const length = resolveProgressSpinnerSize(size);

  if (length === undefined) return [];

  return [['--vf-progress-spinner-size', length]];
}
