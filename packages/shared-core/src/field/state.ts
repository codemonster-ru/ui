// Platform-independent VfField presentation rules.
//
// VfField's own state - which label placement won, whether the control is
// filled - lives in the adapter, because the two platforms learn it in
// completely different ways: Vue through provide/inject and a reactive ref,
// Razor by rendering the control first and reading what it reported. What is
// genuinely shared is what those signals *mean*: which classes they produce,
// what counts as invalid, and which ids end up in aria-describedby.
//
// These record the behaviour of the reference implementation at
// fd793696f50d3be0fcd3788f0f8f751c63869963, including the parts that are
// surprising. Historical quirks are the contract, not defects to normalise.

/** Label placements the historical component's types allow. */
export type VfFieldLabelPlacement = 'top' | 'floating';

/** Floating variants the historical component's types allow. */
export type VfFieldFloatingVariant = 'in' | 'on' | 'over';

export interface VfFieldFloatingInput {
  /** The `labelPlacement` prop. */
  labelPlacement: string;
  /** Whether a label prop or label slot was supplied. */
  hasLabel: boolean;
  /**
   * Whether the control inside the field opted into floating support.
   *
   * This is the half a port is most likely to drop. `labelPlacement:
   * 'floating'` alone never floats anything: the reference waits for the
   * control to say it can participate, so a field wrapping something inert
   * renders a plain top label however it was configured.
   */
  controlSupportsFloating: boolean;
}

/** Whether the label actually floats, which is not the same as asking for it. */
export function isFieldFloatingLabel({
  labelPlacement,
  hasLabel,
  controlSupportsFloating,
}: VfFieldFloatingInput): boolean {
  return labelPlacement === 'floating' && hasLabel && controlSupportsFloating;
}

/**
 * Whether the field is in its invalid state.
 *
 * Either signal is enough, and an error is enough on its own: a field given
 * error text is invalid without anyone setting the prop.
 */
export function isFieldInvalid({ invalid, hasError }: { invalid: boolean; hasError: boolean }): boolean {
  return invalid || hasError;
}

export interface VfFieldRootAppearance {
  invalid: boolean;
  floating: boolean;
  /** The `floatingVariant` prop; defaults to `in` at the call site, not here. */
  floatingVariant: string;
}

/**
 * The root class list, in the order the reference emits it.
 *
 * The variant modifier is emitted only alongside the floating modifier, so a
 * top-placed field carries no trace of its floatingVariant prop. As with the
 * icon button, an undocumented variant value still reaches the class name: the
 * reference interpolates the prop without validating it.
 */
export function resolveFieldClasses({ invalid, floating, floatingVariant }: VfFieldRootAppearance): string[] {
  const classes = ['vf-field'];

  if (invalid) classes.push('vf-field--invalid');
  if (floating) classes.push('vf-field--floating', `vf-field--floating-${floatingVariant}`);

  return classes;
}

/**
 * The class list of the element wrapping the control.
 *
 * `filled` is tracked whether or not the label floats, so a top-placed field
 * still carries the modifier even though only floating layouts use it visually.
 */
export function resolveFieldControlClasses({ floating, filled }: { floating: boolean; filled: boolean }): string[] {
  const classes = ['vf-field__control'];

  if (floating) classes.push('vf-field__control--floating');
  if (filled) classes.push('vf-field__control--filled');

  return classes;
}

export interface VfFieldDescribedByInput {
  descriptionId: string;
  errorId: string;
  hasDescription: boolean;
  hasError: boolean;
}

/**
 * The `aria-describedby` value the field offers to its control.
 *
 * Description first, then error, space separated; undefined rather than an
 * empty string when there is neither, so the attribute is omitted instead of
 * being rendered blank.
 *
 * The field never applies this itself. It hands the value to the default slot
 * and the consumer decides whether it reaches the control - which means a
 * consumer that ignores it produces a field whose description is announced to
 * nobody. That is the reference behaviour.
 */
export function resolveFieldDescribedBy({
  descriptionId,
  errorId,
  hasDescription,
  hasError,
}: VfFieldDescribedByInput): string | undefined {
  const ids = [hasDescription ? descriptionId : undefined, hasError ? errorId : undefined].filter(
    (value): value is string => Boolean(value),
  );

  return ids.length > 0 ? ids.join(' ') : undefined;
}
