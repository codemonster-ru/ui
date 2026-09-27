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
export { resolveSkeletonClasses, resolveSkeletonLength, resolveSkeletonStyle } from './skeleton/state.js';
export type { VfSkeletonDeclaration } from './skeleton/state.js';
export {
  resolveSkeletonGateContentClasses,
  resolveSkeletonGateLength,
  resolveSkeletonGateMinHeight,
  resolveSkeletonGateOverlayStyle,
  resolveSkeletonGateRootStyle,
} from './skeleton-gate/state.js';
export type { VfSkeletonGateDeclaration } from './skeleton-gate/state.js';
export { resolveAvatarBranch, resolveAvatarClasses } from './avatar/state.js';
export type { VfAvatarBranch, VfAvatarShapeName, VfAvatarSizeName } from './avatar/state.js';
export { resolveCardClasses, resolveCardRegions } from './card/state.js';
export type { VfCardRegions } from './card/state.js';
export { resolvePanelClasses, resolvePanelRegions } from './panel/state.js';
export type { VfPanelRegions } from './panel/state.js';
export { resolveAlertClasses, resolveAlertIcon, resolveAlertRegions } from './alert/state.js';
export type { VfAlertRegions } from './alert/state.js';
export {
  resolveProgressSpinnerClasses,
  resolveProgressSpinnerSize,
  resolveProgressSpinnerStyle,
} from './progress-spinner/state.js';
export type { VfProgressSpinnerDeclaration } from './progress-spinner/state.js';
export {
  formatProgressBarNumber,
  resolveProgressBarClasses,
  resolveProgressBarHeight,
  resolveProgressBarMax,
  resolveProgressBarPercentage,
  resolveProgressBarRootStyle,
  resolveProgressBarValue,
  resolveProgressBarValueLabel,
  resolveProgressBarValueSemantics,
  resolveProgressBarValueStyle,
} from './progress-bar/state.js';
export type {
  VfProgressBarClassInput,
  VfProgressBarDeclaration,
  VfProgressBarValueSemantics,
} from './progress-bar/state.js';
export {
  resolveBadgeClasses,
  resolveDividerClasses,
  resolveDividerRole,
  resolveTagClasses,
} from './presentation/state.js';
export type { VfBadgeToneName, VfDividerOrientationName, VfFeedbackToneName } from './presentation/state.js';
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
export { resolveAccordionIconClasses, resolveAccordionOpen, resolveAccordionTransition } from './accordion/state.js';
export { isBreadcrumbLink, resolveBreadcrumbCurrentFlags, resolveBreadcrumbItemClasses } from './breadcrumbs/state.js';
export { resolveLinkClasses, resolveLinkRel } from './link/state.js';
export type { VfLinkToneName, VfLinkUnderlineName } from './link/state.js';
// VfMenuItem. There is deliberately no rel rule beside VfLink's: this
// component writes `rel` exactly as given and derives nothing for
// target=_blank, and VfMenu makes no decision at all.
export {
  MENU_ITEM_FALLBACK_ICON,
  isMenuItemLink,
  resolveMenuItemClasses,
  resolveMenuItemIconName,
} from './menu/state.js';
export type { VfMenuItemToneName } from './menu/state.js';
export {
  formatStepperProgressFactor,
  resolveStepperActiveIndex,
  resolveStepperActiveValue,
  resolveStepperClasses,
  resolveStepperContentPosition,
  resolveStepperFallbackValue,
  resolveStepperRootStyle,
  resolveStepperStepState,
} from './stepper/state.js';
export type {
  VfStepperContentPositionName,
  VfStepperDeclaration,
  VfStepperItemLike,
  VfStepperOrientationName,
  VfStepperStepStateName,
} from './stepper/state.js';
export {
  isTabsItemSelected,
  resolveTabsActiveIndex,
  resolveTabsActiveValue,
  resolveTabsControlledPanelId,
  resolveTabsFallbackValue,
  resolveTabsIndicatorStyle,
  resolveTabsNavigationTarget,
  resolveTabsPanelId,
  resolveTabsScrollerState,
  resolveTabsScrollerStep,
  resolveTabsTabId,
  resolveTabsTabIndex,
  TABS_INDICATOR_HIDDEN,
} from './tabs/state.js';
export type {
  VfTabsDeclaration,
  VfTabsIndicatorMeasurement,
  VfTabsItemLike,
  VfTabsScrollerMeasurement,
  VfTabsScrollerState,
} from './tabs/state.js';
// VfDropdown. Values in, values out: the floating runtime, the escape stack,
// focus and the listeners stay in each adapter.
export {
  DROPDOWN_OFFSET,
  DROPDOWN_STRATEGY,
  DROPDOWN_TRIGGER_OPEN_KEYS,
  resolveDropdownArrowClasses,
  resolveDropdownArrowOffset,
  resolveDropdownFlipPlacements,
  resolveDropdownMenuClasses,
  resolveDropdownMenuNavigation,
  resolveDropdownOpen,
  resolveDropdownTeleport,
  resolveDropdownTriggerState,
} from './dropdown/state.js';
// VfGroupBox. What the props decide - the title test in JavaScript
// truthiness, the open seed, the disclosure flags and the root classes. The
// state itself stays in each adapter.
export {
  resolveGroupBoxClasses,
  resolveGroupBoxFlags,
  resolveGroupBoxHasTitle,
  resolveGroupBoxOpen,
} from './group-box/state.js';
export type { GroupBoxFlags, GroupBoxFlagsInput } from './group-box/state.js';
// VfPopover. Values in, values out: the floating runtime, the escape stack,
// focus and the listeners stay in each adapter. Deliberately not the
// dropdown's rules under another name - see popover/state.ts.
export {
  POPOVER_AUTOFOCUS_SELECTOR,
  POPOVER_OFFSET,
  POPOVER_STRATEGY,
  resolvePopoverArrowClasses,
  resolvePopoverArrowOffset,
  resolvePopoverClosesOnEscape,
  resolvePopoverClosesOnOutsideClick,
  resolvePopoverContentClasses,
  resolvePopoverFlipPlacements,
  resolvePopoverTeleport,
  resolvePopoverTriggerKey,
  resolvePopoverTriggerState,
} from './popover/state.js';
