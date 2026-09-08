// Platform-independent VfButton presentation rules.
//
// VfButton is mostly markup, so there is little to share - but what there is,
// two adapters would otherwise each derive from the same props: the class list,
// and the fact that loading makes a button inert rather than merely decorated.
//
// What deliberately did not move is how each platform decides that a caller
// asked for `disabled`. Vue reads `attrs.disabled === true || attrs.disabled
// === ''`, which is a fact about Vue's attribute fallthrough - and the source
// of a real quirk, since the string "true" therefore does not disable anything.
// PHP receives a prop, not an attrs object. Normalising that is each adapter's
// job; `isButtonDisabled` takes the answer, not the raw attribute.
//
// These record the behaviour of the reference implementation at
// fd793696f50d3be0fcd3788f0f8f751c63869963, including the parts that are
// surprising. Historical quirks are the contract, not defects to normalise.

/** Variants the historical component's types allow. */
export type VfButtonVariantName =
  'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | 'contrast' | 'ghost';

/** Sizes the historical component's types allow. */
export type VfButtonSizeName = 'sm' | 'md' | 'lg';

export interface VfButtonAppearance {
  /** The `variant` prop; defaults to `primary` at the call site, not here. */
  variant: string;
  /** The `size` prop; defaults to `md` at the call site, not here. */
  size: string;
  block: boolean;
  loading: boolean;
}

/**
 * The canonical class list, in the order the reference emits it.
 *
 * Two historical rules, both deliberate:
 *
 * - `md` emits no size modifier at all, so a stylesheet cannot target the
 *   default size by name. The same rule VfIconButton follows.
 * - A value outside the documented union still reaches the class name. The
 *   reference interpolates the prop without validating it, so
 *   `variant="nonsense"` renders `vf-button--nonsense`.
 */
export function resolveButtonClasses({ variant, size, block, loading }: VfButtonAppearance): string[] {
  const classes = ['vf-button', `vf-button--${variant}`];

  if (size !== 'md') classes.push(`vf-button--${size}`);
  if (block) classes.push('vf-button--block');
  if (loading) classes.push('vf-button--loading');

  return classes;
}

/**
 * Whether the rendered button carries the native `disabled` attribute.
 *
 * Loading is not a visual state. The reference applies the native attribute
 * while loading, which is what makes a loading button inert to the pointer and
 * the keyboard alike - and it wins over an explicit `disabled: false`, because
 * the two are combined with `||` rather than the attribute taking precedence.
 */
export function isButtonDisabled({ loading, disabled }: { loading: boolean; disabled: boolean }): boolean {
  return loading || disabled;
}

/**
 * The `aria-busy` value, or undefined when the attribute is omitted entirely.
 *
 * Omitted rather than `"false"`: the reference binds `undefined`, so a button
 * that is not loading carries no `aria-busy` attribute at all.
 */
export function resolveButtonBusy(loading: boolean): 'true' | undefined {
  return loading ? 'true' : undefined;
}
