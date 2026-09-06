// Platform-independent VfInput state rules.
//
// These are the calculations the architecture plan names for the first
// extraction (section 13): clear eligibility, derived adornment state and
// password action metadata. They take plain values and return plain values.
// Nothing here reads a DOM node, a Vue ref, an attrs object or a slot.
//
// They record the behaviour of the reference implementation at
// fd793696f50d3be0fcd3788f0f8f751c63869963, including the parts that are
// surprising. Historical quirks are the contract, not defects to normalise.

/**
 * Filled state of a text control.
 *
 * The reference coerces through `String(value ?? '')`, so `null` and
 * `undefined` are empty rather than the literal strings `"null"`/`"undefined"`,
 * and whitespace counts as filled.
 */
export function isInputFilled(value: string | null | undefined): boolean {
  return String(value ?? '').length > 0;
}

export interface VfInputPasswordRevealAvailability {
  /** The `passwordReveal` prop as the consumer set it. */
  passwordReveal: boolean;
  /** The native `type` the consumer requested, or `undefined` when unset. */
  type: string | undefined;
}

/**
 * Whether the password reveal action exists at all.
 *
 * Historical rule: the action is offered only for an explicit `type="password"`.
 * `passwordReveal` on any other type, including an unset type, renders nothing.
 */
export function isPasswordRevealAvailable({ passwordReveal, type }: VfInputPasswordRevealAvailability): boolean {
  return Boolean(passwordReveal) && type === 'password';
}

export interface VfInputTypeResolution {
  /** The native `type` the consumer requested, or `undefined` when unset. */
  type: string | undefined;
  /** Result of {@link isPasswordRevealAvailable}. */
  passwordRevealAvailable: boolean;
  /** Whether the reveal action is currently toggled on. */
  passwordRevealed: boolean;
}

/**
 * The `type` the control renders with.
 *
 * Only a revealed password becomes `text`. Every other type is passed through
 * untouched, so `number`, `date` and any future native type keep working; the
 * reference never normalised them to a text-like allow list.
 */
export function resolveInputType({
  type,
  passwordRevealAvailable,
  passwordRevealed,
}: VfInputTypeResolution): string | undefined {
  return passwordRevealAvailable && passwordRevealed ? 'text' : type;
}

export interface VfInputClearAvailability {
  /** The `clearable` prop as the consumer set it. */
  clearable: boolean;
  /** Result of {@link isInputFilled}. */
  filled: boolean;
  /** Whether the control is disabled, as the adapter interprets its own attrs. */
  disabled: boolean;
  /** Whether the control is read-only, as the adapter interprets its own attrs. */
  readonly: boolean;
}

/**
 * Whether the clear action should be offered.
 *
 * `disabled` and `readonly` arrive already interpreted: deciding what counts as
 * a truthy boolean attribute is an adapter concern, and the Vue adapter's own
 * rule (only `true`, `""` and `"true"`) is deliberately left where it is.
 */
export function isClearActionAvailable({ clearable, filled, disabled, readonly }: VfInputClearAvailability): boolean {
  return Boolean(clearable) && filled && !disabled && !readonly;
}

export interface VfInputAdornmentFlags {
  /** A leading icon or leading content is present. */
  hasLeadingAdornment: boolean;
  /** A trailing icon or trailing content is present. */
  hasTrailingAdornment: boolean;
  /** Result of {@link isPasswordRevealAvailable}. */
  hasPasswordRevealControl: boolean;
  /** Result of {@link isClearActionAvailable}. */
  hasClearControl: boolean;
}

export interface VfInputAdornmentState extends VfInputAdornmentFlags {
  /** An action button sits at the trailing edge. */
  hasTrailingActionControl: boolean;
  /** Anything at all sits at the trailing edge. */
  hasTrailingControl: boolean;
  /**
   * Anything at all sits beside the control, which is what decides whether the
   * adapter renders a wrapper around the input or the bare input alone.
   */
  hasAdornments: boolean;
}

/**
 * Derives the adornment layout from what is present.
 *
 * This is the rule behind the conditional wrapper: an input with no adornment
 * of any kind renders bare. An adapter that toggles a clear or reveal action at
 * runtime has to recompute this to keep the wrapper and its classes correct.
 */
export function resolveInputAdornmentState(flags: VfInputAdornmentFlags): VfInputAdornmentState {
  const hasTrailingActionControl = flags.hasPasswordRevealControl || flags.hasClearControl;
  const hasTrailingControl = flags.hasTrailingAdornment || hasTrailingActionControl;

  return {
    ...flags,
    hasTrailingActionControl,
    hasTrailingControl,
    hasAdornments: flags.hasLeadingAdornment || hasTrailingControl,
  };
}
