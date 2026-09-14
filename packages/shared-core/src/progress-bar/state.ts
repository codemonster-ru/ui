// Platform-independent rules for VfProgressBar.
//
// Its own file, and deliberately not a "progress" module shared with
// VfProgressSpinner. The two components share the role name `progressbar` and
// the tone union, and nothing else: a bar has a value, a maximum, a determinate
// and an indeterminate branch, a fill whose width is the value, and a label
// element; a spinner has none of those. The tone rule below reads exactly like
// the spinner's - `primary` suppressed, every other value emitted unchecked -
// and is restated rather than imported for the reason every prior copy was:
// two contracts that agree today are two contracts.
//
// What is pinned here is the reference's own arithmetic, quirks included:
//
//   - the maximum falls back to 100 when it is not a finite positive number.
//     Zero, a negative, NaN, Infinity, null and a numeric *string* all fall
//     back - the reference asks Number.isFinite, which is false for a string,
//     so `max="10"` written as text in a Vue template is not 10, it is 100;
//   - the value falls back to 0 when it is not finite - the same list, and
//     the same string quirk - and is otherwise clamped into [0, max]. A
//     negative is 0, an overflow is the maximum, and there is no rounding;
//   - the percentage is the raw ratio times 100, serialised the way JavaScript
//     serialises a number: `33.33333333333333%`, `58.333333333333336%`,
//     `9.999999999999998e-8%`. Nothing is rounded and nothing is trimmed;
//   - the visible label is the ratio rounded with Math.round, which rounds a
//     half up: 12.5% reads "13%";
//   - the indeterminate branch drops all three aria-value* attributes and the
//     fill's inline size, and adds one modifier. A value passed alongside
//     `indeterminate` is simply not written anywhere.
//
// These record the behaviour of the reference implementation at
// fd793696f50d3be0fcd3788f0f8f751c63869963.

/** One CSS declaration, as the name/value pair both adapters write. */
export type VfProgressBarDeclaration = readonly [property: string, value: string];

/** The three value attributes a determinate bar writes, already serialised. */
export interface VfProgressBarValueSemantics {
  readonly valuemin: string;
  readonly valuemax: string;
  readonly valuenow: string;
}

export interface VfProgressBarClassInput {
  readonly tone: string;
  readonly striped: boolean;
  readonly animated: boolean;
  readonly indeterminate: boolean;
}

/**
 * A number as JavaScript writes it into an attribute.
 *
 * `String(n)`: no trailing `.0`, no fixed precision, exponent form below 1e-6.
 * Stated as a rule so that the PHP mirror has a vector file to agree with - a
 * server that wrote `58.333333333333` or `1.0E-7` would render a different
 * width and announce a different value.
 */
export function formatProgressBarNumber(value: number): string {
  return String(value);
}

/**
 * The maximum the bar actually uses.
 *
 * A finite number greater than zero is kept as-is; anything else - zero, a
 * negative, NaN, Infinity, null, undefined, or a string, numeric or not -
 * falls back to 100.
 */
export function resolveProgressBarMax(max: number | string | null | undefined): number {
  return typeof max === 'number' && Number.isFinite(max) && max > 0 ? max : 100;
}

/**
 * The value the bar actually uses, given the resolved maximum.
 *
 * Non-finite - NaN, Infinity, null, undefined, a string - is 0. Otherwise the
 * value is clamped into [0, max]: a negative reads as 0 and an overflow as
 * the maximum. No rounding.
 */
export function resolveProgressBarValue(value: number | string | null | undefined, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), max);
}

/** The fill's inline size: the raw ratio times 100, as a percentage string. */
export function resolveProgressBarPercentage(value: number, max: number): string {
  return `${formatProgressBarNumber((value / max) * 100)}%`;
}

/** The visible label: the ratio rounded half-up to a whole percent. */
export function resolveProgressBarValueLabel(value: number, max: number): string {
  return `${Math.round((value / max) * 100)}%`;
}

/**
 * The root class list, in the order the reference emits it.
 *
 * The block, then the tone modifier for every tone but `primary` (an unknown
 * tone is interpolated unchecked), then `--striped`, then `--animated` only
 * when striped as well, then `--indeterminate` last. `animated` alone emits
 * nothing: the stripes are what would animate.
 */
export function resolveProgressBarClasses({
  tone,
  striped,
  animated,
  indeterminate,
}: VfProgressBarClassInput): string[] {
  const classes = ['vf-progress-bar'];

  if (tone !== 'primary') classes.push(`vf-progress-bar--${tone}`);
  if (striped) classes.push('vf-progress-bar--striped');
  if (striped && animated) classes.push('vf-progress-bar--animated');
  if (indeterminate) classes.push('vf-progress-bar--indeterminate');

  return classes;
}

/**
 * A `height` prop as a CSS length.
 *
 * A number becomes pixels, `0` included; a string passes through verbatim.
 * Absent is absent. The same shape as the spinner's size rule and the
 * skeleton's length rule, and its own copy for the reason theirs are.
 */
export function resolveProgressBarHeight(value: string | number | null | undefined): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  return typeof value === 'number' ? `${value}px` : value;
}

/**
 * The declarations the component writes into the root style attribute.
 *
 * One custom property, `--vf-progress-bar-height`, or nothing when the height
 * is absent so the theme token applies. An empty string is *kept* as an empty
 * declaration, because the reference hands a plain object to Vue's serialisers
 * and they disagree about it: the client drops it, the server writes
 * `--vf-progress-bar-height:;`. Dropping it here would move the reference's
 * server bytes. What the Razor adapter does with it is its own decision.
 */
export function resolveProgressBarRootStyle(height: string | number | null | undefined): VfProgressBarDeclaration[] {
  const length = resolveProgressBarHeight(height);

  if (length === undefined) return [];

  return [['--vf-progress-bar-height', length]];
}

/**
 * The declarations the component writes into the fill's style attribute.
 *
 * `inline-size` at the percentage while determinate; nothing while
 * indeterminate, where the stylesheet stretches the fill to the whole track and
 * animates two pseudo-elements across it.
 */
export function resolveProgressBarValueStyle(indeterminate: boolean, percentage: string): VfProgressBarDeclaration[] {
  if (indeterminate) return [];

  return [['inline-size', percentage]];
}

/**
 * The value attributes the root writes, or null while indeterminate.
 *
 * Determinate: aria-valuemin is always 0 - the reference never exposes a
 * different floor - aria-valuemax is the resolved maximum and aria-valuenow the
 * resolved value, both serialised as JavaScript serialises them. Indeterminate:
 * none of the three is written, whatever value and max were passed.
 */
export function resolveProgressBarValueSemantics(
  indeterminate: boolean,
  value: number,
  max: number,
): VfProgressBarValueSemantics | null {
  if (indeterminate) return null;

  return { valuemin: '0', valuemax: formatProgressBarNumber(max), valuenow: formatProgressBarNumber(value) };
}
