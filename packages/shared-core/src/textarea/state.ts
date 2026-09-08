// Platform-independent VfTextarea presentation rules.
//
// There is exactly one, because there is exactly one thing both adapters derive
// from the same inputs: the class list. Everything else this component does is
// either already shared or deliberately not shareable.
//
// `isInputFilled` is reused rather than copied. VfTextarea's filled test is
// byte for byte the rule VfInput uses - string length, not trimmed content - so
// a `isTextareaFilled` would have been the same function under a second name,
// and the quirk would then have had two places to drift from.
//
// The reactive half stays in the adapters. Vue tracks the value in a ref and
// reports it through provide/inject; Razor knows it at render time. Extracting
// that channel rather than the rule is how a universal form abstraction starts.

/** Sizes the historical component's types allow. */
export type VfTextareaSizeName = 'sm' | 'md' | 'lg';

export interface VfTextareaAppearance {
  /** The `size` prop; defaults to `md` at the call site, not here. */
  size: string;
  invalid: boolean;
  /**
   * Whether the surrounding field asked for a floating label.
   *
   * Read from the placement alone, exactly as VfInput does: the control carries
   * the modifier even when the field itself did not end up floating.
   */
  floating: boolean;
}

/**
 * The canonical class list, in the order the reference emits it.
 *
 * As elsewhere in the library, `md` emits no size modifier at all, and a value
 * outside the documented union still reaches the class name because the
 * reference interpolates the prop without validating it.
 */
export function resolveTextareaClasses({ size, invalid, floating }: VfTextareaAppearance): string[] {
  const classes = ['vf-textarea'];

  if (size !== 'md') classes.push(`vf-textarea--${size}`);
  if (invalid) classes.push('vf-textarea--invalid');
  if (floating) classes.push('vf-textarea--floating');

  return classes;
}
