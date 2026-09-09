// Public entry of the platform-neutral shared core.
//
// The surface is the set of rules a real adapter uses, nothing more. M05 added
// the first entries: the VfInput state calculations the Vue adapter consumes
// today and a Razor browser controller will consume when it toggles the same
// actions.
//
// The boundary is enforced by scripts/ci/check-architecture-boundaries.mjs:
// nothing here may import Vue, the Vue adapter packages, the Razor adapter, the
// showcase, or use browser globals.
export {
  isClearActionAvailable,
  isInputFilled,
  isPasswordRevealAvailable,
  resolveInputAdornmentState,
  resolveInputType,
} from './input/state.js';
export { resolveIconButtonClasses, resolveIconButtonIconSize } from './icon-button/state.js';
export { isButtonDisabled, resolveButtonBusy, resolveButtonClasses } from './button/state.js';
export { resolveTextareaClasses } from './textarea/state.js';
export {
  isRadioChecked,
  resolveCheckboxAriaChecked,
  resolveCheckboxClasses,
  resolveRadioClasses,
  resolveSwitchClasses,
} from './checkable/state.js';
export type {
  VfCheckableSize,
  VfCheckboxAppearance,
  VfRadioAppearance,
  VfSwitchAppearance,
} from './checkable/state.js';
export type { VfTextareaAppearance, VfTextareaSizeName } from './textarea/state.js';
export type { VfButtonAppearance, VfButtonSizeName, VfButtonVariantName } from './button/state.js';
export {
  isFieldFloatingLabel,
  isFieldInvalid,
  resolveFieldClasses,
  resolveFieldControlClasses,
  resolveFieldDescribedBy,
} from './field/state.js';
export type {
  VfFieldDescribedByInput,
  VfFieldFloatingInput,
  VfFieldFloatingVariant,
  VfFieldLabelPlacement,
  VfFieldRootAppearance,
} from './field/state.js';
export type { VfIconButtonAppearance, VfIconButtonSize, VfIconButtonVariant } from './icon-button/state.js';
export { getIcon, resolvePasswordRevealIcon, vfIcons } from './icons/registry.js';
export type { VfIconData, VfIconName } from './icons/registry.js';
export type {
  VfInputAdornmentFlags,
  VfInputAdornmentState,
  VfInputClearAvailability,
  VfInputPasswordRevealAvailability,
  VfInputTypeResolution,
} from './input/state.js';
