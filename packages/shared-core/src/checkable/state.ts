// Platform-independent presentation rules for the three checkable controls.
//
// One file, three functions, no shared abstraction between them - and that is
// the finding, not an oversight. Characterizing VfCheckbox, VfRadio and
// VfSwitch independently showed contracts that only look alike:
//
//   - the checkbox owns a boolean and has an indeterminate state;
//   - the radio owns no boolean at all, it compares itself against a model and
//     carries its own value;
//   - the switch owns a boolean but adds two presentation props the other two
//     have no equivalent for.
//
// Their class lists therefore share exactly one rule - "the size modifier is
// always emitted, including at the default size" - which is a single line each.
// A ChoiceControl helper taking a block name and a list of state flags would
// have been three call sites configuring a fourth thing, so each control states
// its own list and the duplication stays at one line rather than becoming an
// abstraction.
//
// They live in one file because they are one milestone's worth of related
// rules, not because they share code.
//
// These record the behaviour of the reference implementations at
// fd793696f50d3be0fcd3788f0f8f751c63869963, including the parts that are
// surprising. Historical quirks are the contract, not defects to normalise.

/** Sizes all three components' types allow. */
export type VfCheckableSize = 'sm' | 'md' | 'lg';

export interface VfCheckboxAppearance {
  /** The `size` prop; defaults to `md` at the call site, not here. */
  size: string;
  checked: boolean;
  indeterminate: boolean;
  invalid: boolean;
  disabled: boolean;
}

/**
 * The checkbox root class list, in the order the reference emits it.
 *
 * Note the size modifier is emitted even at `md`, unlike VfInput, VfButton and
 * VfTextarea, where the default size is expressed by the absence of a class.
 * Two conventions coexist in this library and both are preserved.
 */
export function resolveCheckboxClasses({
  size,
  checked,
  indeterminate,
  invalid,
  disabled,
}: VfCheckboxAppearance): string[] {
  const classes = ['vf-checkbox', `vf-checkbox--${size}`];

  if (checked) classes.push('vf-checkbox--checked');
  if (indeterminate) classes.push('vf-checkbox--indeterminate');
  if (invalid) classes.push('vf-checkbox--invalid');
  if (disabled) classes.push('vf-checkbox--disabled');

  return classes;
}

/**
 * The value a checkbox reports through `aria-checked`.
 *
 * The reference sets this explicitly on a native checkbox, which already
 * exposes its own state - redundant, but it is where `mixed` lives, and
 * indeterminate wins over the model.
 */
export function resolveCheckboxAriaChecked({
  checked,
  indeterminate,
}: {
  checked: boolean;
  indeterminate: boolean;
}): 'true' | 'false' | 'mixed' {
  if (indeterminate) return 'mixed';

  return checked ? 'true' : 'false';
}

export interface VfRadioAppearance {
  size: string;
  checked: boolean;
  invalid: boolean;
  disabled: boolean;
}

/** The radio root class list. It has no indeterminate state to report. */
export function resolveRadioClasses({ size, checked, invalid, disabled }: VfRadioAppearance): string[] {
  const classes = ['vf-radio', `vf-radio--${size}`];

  if (checked) classes.push('vf-radio--checked');
  if (invalid) classes.push('vf-radio--invalid');
  if (disabled) classes.push('vf-radio--disabled');

  return classes;
}

/**
 * Whether a radio is the selected member of its group.
 *
 * Strict equality, so a numeric model does not select a string-valued radio.
 * Shared because both adapters have to answer the same question and getting it
 * loose would silently select two members at once.
 */
export function isRadioChecked(modelValue: unknown, value: unknown): boolean {
  return modelValue === value;
}

export interface VfSwitchAppearance {
  size: string;
  /** The `static` prop; a reserved word in some call sites, hence the name. */
  isStatic: boolean;
  /** The `thumbContrast` prop; `auto` emits no modifier. */
  thumbContrast: string;
  checked: boolean;
  invalid: boolean;
  disabled: boolean;
}

/**
 * The switch root class list.
 *
 * Two modifiers the other two controls have no equivalent for, and the contrast
 * one is emitted only when it is not `auto`.
 */
export function resolveSwitchClasses({
  size,
  isStatic,
  thumbContrast,
  checked,
  invalid,
  disabled,
}: VfSwitchAppearance): string[] {
  const classes = ['vf-switch', `vf-switch--${size}`];

  if (isStatic) classes.push('vf-switch--static');
  if (thumbContrast !== 'auto') classes.push(`vf-switch--thumb-contrast-${thumbContrast}`);
  if (checked) classes.push('vf-switch--checked');
  if (invalid) classes.push('vf-switch--invalid');
  if (disabled) classes.push('vf-switch--disabled');

  return classes;
}
