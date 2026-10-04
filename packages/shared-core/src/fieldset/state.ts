// Platform-independent presentation rules for VfFieldset.
//
// Its own file, and deliberately not a reuse of the VfField rules. The two
// components compute the same describedBy string and the same "an error is
// invalid" rule today, and they did so independently in the reference too:
// importing field/state.ts here would make every field defect a fieldset
// defect and let either component's evidence stand in for the other's. Nor is
// it a rule about fieldsets in general - VfGroupBox is the other migrated
// fieldset, and it shares nothing with this one.
//
// These record the behaviour of the reference implementation at
// fd793696f50d3be0fcd3788f0f8f751c63869963.

/** Which of the fieldset's optional parts render. */
export interface VfFieldsetPresence {
  /** `legend.vf-fieldset__legend`. */
  label: boolean;
  /** `p.vf-fieldset__description`, and its id in aria-describedby. */
  description: boolean;
  /** `p.vf-fieldset__error`, its id in aria-describedby, and the invalid state. */
  error: boolean;
}

/**
 * Which parts a fieldset renders.
 *
 * JavaScript truthiness for a prop and presence for a slot: "" is no label,
 * "0" is one, and a slot counts even when it renders nothing - the prop is
 * then the slot's fallback text, which each adapter renders itself.
 */
export function resolveFieldsetPresence(input: {
  label?: string | null;
  description?: string | null;
  error?: string | null;
  hasLabelSlot: boolean;
  hasDescriptionSlot: boolean;
  hasErrorSlot: boolean;
}): VfFieldsetPresence {
  return {
    label: Boolean(input.label) || input.hasLabelSlot,
    description: Boolean(input.description) || input.hasDescriptionSlot,
    error: Boolean(input.error) || input.hasErrorSlot,
  };
}

/**
 * Whether the fieldset is in its invalid state.
 *
 * Either signal is enough. It is a class and the scoped slot's `invalid`, and
 * nothing else: the reference writes no aria-invalid anywhere.
 */
export function isFieldsetInvalid({ invalid, hasError }: { invalid: boolean; hasError: boolean }): boolean {
  return invalid || hasError;
}

/**
 * The fieldset's own `aria-describedby`, which is also the scoped slot's
 * `describedBy`.
 *
 * Description first, then error, space separated; undefined rather than an
 * empty string when there is neither, so the attribute is omitted.
 */
export function resolveFieldsetDescribedBy({
  descriptionId,
  errorId,
  hasDescription,
  hasError,
}: {
  descriptionId: string;
  errorId: string;
  hasDescription: boolean;
  hasError: boolean;
}): string | undefined {
  const ids = [hasDescription ? descriptionId : undefined, hasError ? errorId : undefined].filter(
    (value): value is string => Boolean(value),
  );

  return ids.length > 0 ? ids.join(' ') : undefined;
}

/** The fieldset root class list, in the order the reference emits it. */
export function resolveFieldsetClasses(invalid: boolean): string[] {
  const classes = ['vf-fieldset'];

  if (invalid) classes.push('vf-fieldset--invalid');

  return classes;
}
