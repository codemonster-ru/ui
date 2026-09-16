// The negative fixture for M01.
//
// A large characterization suite proves nothing on its own: it has to fail when
// the component regresses. Each mutation below reproduces a regression the first
// migration actually shipped (architecture plan, section 6). The mutation is
// applied in memory by a Vite plugin, so VfInput.vue on disk is never modified.
export const inputSourcePath = 'packages/core/src/components/input/VfInput.vue';
export const sharedInputRulesPath = 'packages/shared-core/src/input/state.ts';
export const iconButtonSourcePath = 'packages/core/src/components/icon-button/VfIconButton.vue';
export const fieldSourcePath = 'packages/core/src/components/field/VfField.vue';
export const buttonSourcePath = 'packages/core/src/components/button/VfButton.vue';
export const textareaSourcePath = 'packages/core/src/components/textarea/VfTextarea.vue';
export const checkboxSourcePath = 'packages/core/src/components/checkbox/VfCheckbox.vue';
export const radioSourcePath = 'packages/core/src/components/radio/VfRadio.vue';
export const switchSourcePath = 'packages/core/src/components/switch/VfSwitch.vue';
export const badgeSourcePath = 'packages/core/src/components/badge/VfBadge.vue';
export const tagSourcePath = 'packages/core/src/components/tag/VfTag.vue';
export const dividerSourcePath = 'packages/core/src/components/divider/VfDivider.vue';
export const skeletonSourcePath = 'packages/core/src/components/skeleton/VfSkeleton.vue';
export const avatarSourcePath = 'packages/core/src/components/avatar/VfAvatar.vue';
export const cardSourcePath = 'packages/core/src/components/card/VfCard.vue';
export const skeletonGateSourcePath = 'packages/core/src/components/skeleton-gate/VfSkeletonGate.vue';

/** The shared rules VfSkeletonGate and the Razor adapter both derive from. */
export const skeletonGateRulePath = 'packages/shared-core/src/skeleton-gate/state.ts';

/**
 * The consumer suite a VfSkeleton defect is expected to reach.
 *
 * VfSkeletonGate renders VfSkeleton, so a child defect is a gate defect too.
 * Naming it turns the coupling into a claim the gate checks - see the
 * attribution rule in check-input-characterization.mjs.
 */
const gateSuite = 'src/components/skeleton-gate/VfSkeletonGate.characterization.spec.ts';

/** The shared rules VfSkeleton and the Razor adapter both derive from. */
export const skeletonRulePath = 'packages/shared-core/src/skeleton/state.ts';

/** The shared rules VfAvatar and the Razor adapter both derive from, including the fallback chain. */
export const avatarRulePath = 'packages/shared-core/src/avatar/state.ts';

/** The shared rules VfCard and the Razor adapter both derive from. */
export const cardRulePath = 'packages/shared-core/src/card/state.ts';
export const panelSourcePath = 'packages/core/src/components/panel/VfPanel.vue';
/** The shared rules VfPanel and the Razor adapter both derive from. */
export const panelRulePath = 'packages/shared-core/src/panel/state.ts';
export const alertSourcePath = 'packages/core/src/components/alert/VfAlert.vue';
/** The shared rules VfAlert and the Razor adapter both derive from. */
export const alertRulePath = 'packages/shared-core/src/alert/state.ts';
export const progressSpinnerSourcePath = 'packages/core/src/components/progress-spinner/VfProgressSpinner.vue';
/** The shared rules VfProgressSpinner and the Razor adapter both derive from. */
export const progressSpinnerRulePath = 'packages/shared-core/src/progress-spinner/state.ts';
export const progressBarSourcePath = 'packages/core/src/components/progress-bar/VfProgressBar.vue';
/** The shared rules VfProgressBar and the Razor adapter both derive from. */
export const progressBarRulePath = 'packages/shared-core/src/progress-bar/state.ts';

export const accordionSourcePath = 'packages/core/src/components/accordion/VfAccordion.vue';
export const linkSourcePath = 'packages/core/src/components/link/VfLink.vue';
/** The shared rules VfLink and the Razor adapter both derive from: the class list and the rel derivation. */
export const linkRulePath = 'packages/shared-core/src/link/state.ts';
const linkSuite = 'src/components/link/VfLink.characterization.spec.ts';
export const stepperSourcePath = 'packages/core/src/components/stepper/VfStepper.vue';
/** The shared rules VfStepper, its Razor controller and the PHP adapter derive from. */
export const stepperRulePath = 'packages/shared-core/src/stepper/state.ts';
const stepperSuite = 'src/components/stepper/VfStepper.characterization.spec.ts';
export const tabsSourcePath = 'packages/core/src/components/tabs/VfTabs.vue';
/**
 * The internal horizontal scroller VfTabs renders. Not a public component and
 * not migrated on its own: VfMenuBar renders it too, but has no
 * characterization suite, so a scroller defect is attributed to the tabs
 * suite alone.
 */
export const horizontalScrollerSourcePath = 'packages/core/src/components/internal/VfHorizontalScroller.vue';
/** The shared rules VfTabs, its Razor controller and the PHP adapter derive from. */
export const tabsRulePath = 'packages/shared-core/src/tabs/state.ts';
const tabsSuite = 'src/components/tabs/VfTabs.characterization.spec.ts';
/** The shared rules VfAccordion, its Razor controller and the PHP adapter derive from. */
export const accordionRulePath = 'packages/shared-core/src/accordion/state.ts';
/**
 * The disclosure composable VfAccordion's state model lives in. Not migrated
 * and not accordion-specific - the dialog, drawer and popover share it - so a
 * mutation here is attributed to the accordion suite alone because no other
 * consumer of it has a characterization suite yet.
 */
export const disclosureComposablePath = 'packages/core/src/composables/useDisclosure.ts';
const accordionSuite = 'src/components/accordion/VfAccordion.characterization.spec.ts';

/**
 * The consumer suite a VfProgressSpinner defect is expected to reach.
 *
 * VfButton renders VfProgressSpinner while loading, so a spinner defect is a
 * button defect wherever the button exercises the spinner - the M17 rule,
 * applied to the second composing component. The button mutations name this
 * suite as their own, which is the other half of the same proof: a button
 * defect must never reach the spinner's suite.
 */
const buttonSuite = 'src/components/button/VfButton.characterization.spec.ts';
const spinnerSuite = 'src/components/progress-spinner/VfProgressSpinner.characterization.spec.ts';
const barSuite = 'src/components/progress-bar/VfProgressBar.characterization.spec.ts';

/** The shared rules the three M15 presentation components and the Razor adapter derive from. */
export const presentationRulePath = 'packages/shared-core/src/presentation/state.ts';

/** The shared rules the three checkable controls and the Razor adapter derive from. */
export const checkableRulePath = 'packages/shared-core/src/checkable/state.ts';

/** The shared rules VfTextarea and the Razor adapter both derive their presentation from. */
export const textareaRulePath = 'packages/shared-core/src/textarea/state.ts';

/** The shared rules VfButton and the Razor adapter both derive their presentation from. */
export const buttonRulePath = 'packages/shared-core/src/button/state.ts';

/** The shared rules VfField and the Razor adapter both derive their presentation from. */
export const fieldRulePath = 'packages/shared-core/src/field/state.ts';

/** The shared rule VfIconButton and the Razor adapter both derive their class list from. */
export const iconButtonRulePath = 'packages/shared-core/src/icon-button/state.ts';

export const inputMutations = [
  {
    id: 'drop-leading-icon',
    description: 'leadingIcon prop no longer renders an adornment (main dropped leadingIcon entirely)',
    find: 'hasLeadingAdornment: Boolean(props.leadingIcon) || Boolean(slots.leading),',
    replace: 'hasLeadingAdornment: Boolean(slots.leading),',
  },
  {
    id: 'drop-trailing-icon',
    description: 'trailingIcon prop no longer renders an adornment (main dropped trailingIcon entirely)',
    find: 'hasTrailingAdornment: Boolean(props.trailingIcon) || Boolean(slots.trailing),',
    replace: 'hasTrailingAdornment: Boolean(slots.trailing),',
  },
  {
    id: 'normalise-native-type',
    description: 'native type is normalised to a text-like allow list (main restricted type to six values)',
    find: "const inputType = computed(() => (typeof attrs.type === 'string' ? attrs.type : undefined));",
    replace:
      "const inputType = computed(() =>\n  typeof attrs.type === 'string' && ['text', 'email', 'search', 'tel', 'url', 'password'].includes(attrs.type)\n    ? attrs.type\n    : 'text',\n);",
  },
  {
    id: 'move-consumer-class-to-input',
    description: 'consumer class/style move from the wrapper onto the input when adorned',
    find: '  <div v-if="hasAdornments" :class="[wrapperClasses, externalClass]" :style="externalStyle">',
    replace: '  <div v-if="hasAdornments" :class="wrapperClasses">',
  },
  {
    id: 'clear-without-focus-return',
    description: 'clear no longer returns focus to the input',
    find: "  currentValue.value = '';\n  emit('update:modelValue', '');\n  inputRef.value?.focus();",
    replace: "  currentValue.value = '';\n  emit('update:modelValue', '');",
  },
  {
    id: 'clear-emits-nothing',
    description: 'clear stops emitting update:modelValue',
    find: "  currentValue.value = '';\n  emit('update:modelValue', '');\n  inputRef.value?.focus();",
    replace: "  currentValue.value = '';\n  inputRef.value?.focus();",
  },
  {
    id: 'clear-ignores-readonly',
    description: 'clear control appears on readonly inputs',
    find: '    readonly: isReadonly.value,',
    replace: '    readonly: false,',
  },
  {
    id: 'lose-selection-direction',
    description: 'password reveal restores offsets but loses the selection direction',
    find: "    direction: input.selectionDirection ?? 'none',",
    replace: "    direction: 'none',",
  },
  {
    id: 'lose-selection-restore',
    description: 'password reveal no longer restores the caret at all',
    find: '  input.focus();\n  input.setSelectionRange(selection.start, selection.end, selection.direction);',
    replace: '  input.focus();',
  },
  {
    id: 'drop-field-integration',
    description: 'field injection is removed, so floating labels stop working',
    find: 'const fieldContext = inject(vfFieldContextKey, null);',
    replace: 'const fieldContext: null = null;\nvoid vfFieldContextKey;\nvoid inject;',
  },
  {
    id: 'drop-filled-marker',
    description: 'data-vf-filled disappears from the input',
    find: ':data-vf-filled="hasValue || undefined"',
    replace: '',
    all: true,
  },
  // M05 moved these calculations into shared-core. Breaking a shared rule must
  // still fail the Vue characterization suite, or the extraction moved
  // behaviour somewhere the observable gates cannot see.
  {
    id: 'shared-filled-rule',
    description: 'shared filled predicate stops reporting a non-empty value as filled',
    file: sharedInputRulesPath,
    find: "  return String(value ?? '').length > 0;",
    replace: '  return false;',
  },
  {
    id: 'shared-type-resolution',
    description: 'shared type resolution stops revealing a password as text',
    file: sharedInputRulesPath,
    find: "  return passwordRevealAvailable && passwordRevealed ? 'text' : type;",
    replace: '  return type;',
  },
  {
    id: 'shared-clear-eligibility',
    description: 'shared clear eligibility stops honouring the read-only state',
    file: sharedInputRulesPath,
    find: '  return Boolean(clearable) && filled && !disabled && !readonly;',
    replace: '  return Boolean(clearable) && filled && !disabled;',
  },
  {
    id: 'shared-adornment-state',
    description: 'shared adornment state stops counting a leading adornment',
    file: sharedInputRulesPath,
    find: '    hasAdornments: flags.hasLeadingAdornment || hasTrailingControl,',
    replace: '    hasAdornments: hasTrailingControl,',
  },
  {
    id: 'floating-always-on',
    description: 'floating state stops depending on the field label placement',
    find: "const isFloatingLabel = computed(() => fieldContext?.labelPlacement.value === 'floating');",
    replace: 'const isFloatingLabel = computed(() => Boolean(fieldContext));',
  },
];

// M10 characterizes the second component. VfIconButton is render-only, so its
// regressions are all in what the template emits: a lost modifier class, a lost
// attribute, a glyph that stops being hidden from assistive technology. Each of
// these shipped somewhere in the first migration.
export const iconButtonMutations = [
  // The class list and icon size moved into shared-core, so these three defects
  // are injected where the rule now lives. That is the point of mutating the
  // rule rather than the SFC: a defect there has to be caught through both
  // adapters, not just the one that used to own the code.
  {
    id: 'icon-button-drops-size-modifier',
    description: 'the size modifier class stops being emitted, so sm and lg render as md',
    file: iconButtonRulePath,
    find: "  if (size !== 'md') {\n    classes.push(`vf-icon-button--${size}`);\n  }",
    replace: '',
  },
  {
    id: 'icon-button-drops-variant-modifier',
    description: 'the variant modifier class disappears, so every button renders as the base style',
    file: iconButtonRulePath,
    find: "const classes = ['vf-icon-button', `vf-icon-button--${variant}`];",
    replace: "const classes = ['vf-icon-button'];",
  },
  {
    id: 'icon-button-normalises-icon-size',
    description: 'the small glyph size collapses to the medium token',
    file: iconButtonRulePath,
    find: "    return 'var(--vf-icon-size-sm)';",
    replace: "    return 'var(--vf-icon-size-md)';",
  },
  {
    id: 'icon-button-exposes-glyph-to-assistive-tech',
    description: 'the glyph stops being aria-hidden, so it competes with the accessible name',
    file: iconButtonSourcePath,
    find: ' aria-hidden="true"',
    replace: '',
  },
  {
    id: 'icon-button-drops-attribute-forwarding',
    description: 'inherited attrs stop reaching the button, losing aria-label, disabled and consumer class',
    file: iconButtonSourcePath,
    find: ' v-bind="attrs"',
    replace: '',
  },
  {
    id: 'icon-button-drops-explicit-type',
    description: 'the explicit button type disappears, so the control submits a surrounding form',
    file: iconButtonSourcePath,
    find: ' :type="props.type"',
    replace: '',
  },
];

/** Everything the characterization gate mutates, across both migrated components. */

// M11. VfField's characterization is mostly about relationships - which element
// points at which - and a relationship regression is invisible in a snapshot:
// the markup still looks right, the label just stops reaching the control.
// These are the ways that can break.
export const fieldMutations = [
  {
    id: 'field-drops-label-class',
    file: fieldSourcePath,
    description: 'the top label loses its canonical class',
    find: ':for="controlId" class="vf-field__label">',
    replace: ':for="controlId" class="">',
  },
  {
    id: 'field-breaks-label-association',
    file: fieldSourcePath,
    description: 'the label no longer points at the control (clicking it focuses nothing)',
    find: '<label v-if="hasLabel && !isFloatingLabel" :for="controlId"',
    replace: '<label v-if="hasLabel && !isFloatingLabel"',
  },
  {
    id: 'field-hands-the-slot-the-wrong-id',
    file: fieldSourcePath,
    description: 'the control receives the description id, so label.for points at nothing',
    find: '<slot :control-id="controlId"',
    replace: '<slot :control-id="descriptionId"',
  },
  {
    id: 'field-describes-the-wrong-node',
    file: fieldRulePath,
    description: 'aria-describedby names the error twice and never the description',
    find: 'const ids = [hasDescription ? descriptionId : undefined, hasError ? errorId : undefined].filter(',
    replace: 'const ids = [hasDescription ? errorId : undefined, hasError ? errorId : undefined].filter(',
  },
  {
    id: 'field-drops-the-invalid-class',
    file: fieldRulePath,
    description: 'an errored field stops looking invalid',
    find: "  if (invalid) classes.push('vf-field--invalid');",
    replace: '',
  },
  {
    id: 'field-drops-the-required-marker',
    file: fieldSourcePath,
    description: 'the required asterisk disappears from both label placements',
    find: '<span v-if="props.required" class="vf-field__required-mark" aria-hidden="true">*</span>',
    replace: '',
    all: true,
  },
  {
    id: 'field-never-floats',
    file: fieldRulePath,
    description: 'the floating placement stops taking effect',
    find: "  return labelPlacement === 'floating' && hasLabel && controlSupportsFloating;",
    replace: '  return false;',
  },
  {
    id: 'field-floats-without-the-control-opting-in',
    file: fieldRulePath,
    description: 'floating no longer waits for a control that supports it',
    find: "  return labelPlacement === 'floating' && hasLabel && controlSupportsFloating;",
    replace: "  return labelPlacement === 'floating' && hasLabel;",
  },
  {
    id: 'field-ignores-the-filled-signal',
    file: fieldRulePath,
    description: 'the control never reports as filled',
    find: "  if (filled) classes.push('vf-field__control--filled');",
    replace: '',
  },
  {
    id: 'field-loses-consumer-attributes',
    file: fieldSourcePath,
    description: 'a consumer class and style stop reaching the root',
    find: "const controlId = useId({ prefix: 'vf-field-control' });",
    replace: "defineOptions({ inheritAttrs: false });\nconst controlId = useId({ prefix: 'vf-field-control' });",
  },
  {
    id: 'field-reuses-one-description-id',
    file: fieldSourcePath,
    description: 'every field on the page shares one description id, so descriptions cross-wire',
    find: "const descriptionId = useId({ prefix: 'vf-field-description' });",
    replace: "const descriptionId = computed(() => 'vf-field-description-shared');",
  },
];

// M12. VfButton is mostly markup, so most of these break the markup. The two
// worth reading are the loading ones: loading applies the native disabled
// attribute, so a regression there does not change how the button looks, it
// just makes an inert control operable again.
/**
 * Every one names the button's suite since M20, and none declares `alsoFails`.
 * That is the reverse-isolation half of the spinner composition proof: a
 * button defect - its loading text, its disabled rule, its root class, its
 * size mapping - must fail the button's evidence and leave the standalone
 * spinner's green. A button mutation that reached VfProgressSpinner's suite
 * would fail the gate as WRONG SUITE, because the dependency runs one way.
 */
export const buttonMutations = [
  {
    id: 'button-submits-by-default',
    file: buttonSourcePath,
    suite: buttonSuite,
    description: 'the default type becomes submit, so a button inside a form posts it',
    find: "  type: 'button',",
    replace: "  type: 'submit',",
  },
  {
    id: 'button-drops-the-variant-modifier',
    file: buttonRulePath,
    suite: buttonSuite,
    description: 'the variant modifier disappears, so every button renders as the base style',
    find: "  const classes = ['vf-button', `vf-button--${variant}`];",
    replace: "  const classes = ['vf-button'];",
  },
  {
    id: 'button-emits-a-default-size-modifier',
    file: buttonRulePath,
    suite: buttonSuite,
    description: 'the medium size starts emitting a modifier the stylesheet never defined',
    find: "  if (size !== 'md') classes.push(`vf-button--${size}`);",
    replace: '  classes.push(`vf-button--${size}`);',
  },
  {
    id: 'button-drops-the-block-modifier',
    file: buttonRulePath,
    suite: buttonSuite,
    description: 'a block button stops filling its container',
    find: "  if (block) classes.push('vf-button--block');",
    replace: '',
  },
  {
    id: 'button-drops-the-loading-modifier',
    file: buttonRulePath,
    suite: buttonSuite,
    description: 'a loading button stops looking like one',
    find: "  if (loading) classes.push('vf-button--loading');",
    replace: '',
  },
  {
    id: 'button-loading-stops-disabling',
    file: buttonRulePath,
    suite: buttonSuite,
    description: 'a loading button becomes operable again, which no snapshot would show',
    find: '  return loading || disabled;',
    replace: '  return disabled;',
  },
  {
    id: 'button-ignores-the-disabled-attribute',
    file: buttonSourcePath,
    suite: buttonSuite,
    description: 'a disabled button becomes operable',
    find: ' :disabled="isDisabled"',
    replace: '',
  },
  {
    id: 'button-drops-attribute-forwarding',
    file: buttonSourcePath,
    suite: buttonSuite,
    description: 'inherited attrs stop reaching the button, losing aria-label, name and consumer class',
    find: 'v-bind="attrs" ',
    replace: '',
  },
  {
    id: 'button-drops-its-slot',
    file: buttonSourcePath,
    suite: buttonSuite,
    description: 'the button renders empty, so it has no label at all',
    find: '    <slot />\n',
    replace: '',
  },
  {
    id: 'button-renders-the-spinner-after-its-label',
    file: buttonSourcePath,
    suite: buttonSuite,
    description: 'the loading spinner moves to the far side of the label',
    find: '    <VfProgressSpinner\n      v-if="props.loading"\n      class="vf-button__spinner"\n      size="var(--vf-icon-current-size)"\n      :stroke-width="5"\n    />\n    <slot />',
    replace:
      '    <slot />\n    <VfProgressSpinner\n      v-if="props.loading"\n      class="vf-button__spinner"\n      size="var(--vf-icon-current-size)"\n      :stroke-width="5"\n    />',
  },
  {
    id: 'button-drops-aria-busy',
    file: buttonRulePath,
    suite: buttonSuite,
    description: 'a loading button stops announcing itself busy',
    find: "  return loading ? 'true' : undefined;",
    replace: '  return undefined;',
  },
  {
    id: 'button-hides-the-spinner-from-assistive-tech',
    file: buttonSourcePath,
    suite: buttonSuite,
    description: 'the spinner loses its own class, so the loading affordance is unnamed',
    find: '      class="vf-button__spinner"\n',
    replace: '',
  },
];

// M13. VfTextarea's defects are mostly about state that never reaches anyone:
// a value that is not rendered, a filled signal the field never hears, an
// aria-invalid that stops being emitted. None of them change the element's
// shape, which is why each one needs its own mutation.
export const textareaMutations = [
  {
    id: 'textarea-does-not-render-its-value',
    file: textareaSourcePath,
    description: 'the model value never reaches the control, so the field renders empty',
    find: '    :value="currentValue"\n',
    replace: '',
  },
  {
    id: 'textarea-stops-emitting-updates',
    file: textareaSourcePath,
    description: 'typing no longer updates the model, so v-model is one-way',
    find: "  emit('update:modelValue', value);",
    replace: '',
  },
  {
    id: 'textarea-ignores-an-external-model-change',
    file: textareaSourcePath,
    description: 'a model value changed from outside stops reaching the control',
    find: '  (value) => {\n    currentValue.value = value;\n  },',
    replace: '  () => {},',
  },
  {
    id: 'textarea-drops-attribute-forwarding',
    file: textareaSourcePath,
    description: 'inherited attrs stop reaching the control, losing rows, name and consumer class',
    find: '    v-bind="attrs"\n',
    replace: '',
  },
  {
    id: 'textarea-drops-the-size-modifier',
    file: textareaRulePath,
    description: 'a small or large control renders at the default size',
    find: "  if (size !== 'md') classes.push(`vf-textarea--${size}`);",
    replace: '',
  },
  {
    id: 'textarea-emits-a-default-size-modifier',
    file: textareaRulePath,
    description: 'the medium size starts emitting a modifier the stylesheet never defined',
    find: "  if (size !== 'md') classes.push(`vf-textarea--${size}`);",
    replace: '  classes.push(`vf-textarea--${size}`);',
  },
  {
    id: 'textarea-drops-the-invalid-modifier',
    file: textareaRulePath,
    description: 'an invalid control stops looking invalid',
    find: "  if (invalid) classes.push('vf-textarea--invalid');",
    replace: '',
  },
  {
    id: 'textarea-drops-aria-invalid',
    file: textareaSourcePath,
    description: 'an invalid control stops reporting itself invalid to assistive tech',
    find: '    :aria-invalid="props.invalid || undefined"\n',
    replace: '',
  },
  {
    id: 'textarea-drops-the-filled-attribute',
    file: textareaSourcePath,
    description: 'the filled marker disappears from the control',
    find: '    :data-vf-filled="hasValue || undefined"\n',
    replace: '',
  },
  {
    id: 'textarea-trims-before-testing-filled',
    file: textareaSourcePath,
    description: 'whitespace stops counting as filled, changing when a floating label lifts',
    find: 'const hasValue = computed(() => isInputFilled(currentValue.value));',
    replace: "const hasValue = computed(() => isInputFilled(String(currentValue.value ?? '').trim()));",
  },
  {
    id: 'textarea-never-reports-filled-to-the-field',
    file: textareaSourcePath,
    description: 'the field never hears about the filled state, so a floating label never lifts',
    find: '    fieldContext?.setFilled(value);',
    replace: '',
  },
  {
    id: 'textarea-drops-field-floating-support',
    file: textareaSourcePath,
    description: 'the control stops opting into floating, so its field renders a plain label',
    find: 'fieldContext?.setFloatingSupported(true);',
    replace: '',
  },
  {
    id: 'textarea-drops-the-floating-modifier',
    file: textareaRulePath,
    description: 'the control stops carrying the floating modifier inside a floating field',
    find: "  if (floating) classes.push('vf-textarea--floating');",
    replace: '',
  },
];

// M14. Three checkable controls that look alike and are not alike, so each gets
// its own mutations rather than a shared set. The ones worth reading are the
// differences: the checkbox's indeterminate is a DOM property that exists only
// because the component assigns it, the radio's checked state is a strict
// comparison rather than a boolean it owns, and the switch decides it has
// content by walking VNodes rather than asking whether a slot was passed.
export const checkboxMutations = [
  {
    id: 'checkbox-does-not-reflect-its-model',
    file: checkboxSourcePath,
    description: 'the model stops reaching the native checked state',
    find: '      :checked="props.modelValue"\n',
    replace: '',
  },
  {
    id: 'checkbox-stops-emitting-updates',
    file: checkboxSourcePath,
    description: 'toggling no longer updates the model, so v-model is one-way',
    find: "  emit('update:modelValue', nextValue);",
    replace: '',
  },
  {
    id: 'checkbox-stops-emitting-change',
    file: checkboxSourcePath,
    description: 'the change event disappears while update:modelValue survives',
    find: "  emit('change', nextValue);",
    replace: '',
  },
  {
    id: 'checkbox-never-syncs-indeterminate',
    file: checkboxSourcePath,
    description: 'the indeterminate DOM property is never assigned, so it exists nowhere',
    find: '    input.value.indeterminate = props.indeterminate;',
    replace: '',
  },
  {
    id: 'checkbox-reports-indeterminate-as-checked',
    file: checkableRulePath,
    description: 'aria-checked stops saying mixed and falls back to the model',
    find: "  if (indeterminate) return 'mixed';",
    replace: '',
  },
  {
    id: 'checkbox-drops-the-indeterminate-mark',
    file: checkboxSourcePath,
    description: 'an indeterminate checkbox renders the ordinary tick',
    find: '      <span v-if="props.indeterminate" class="vf-checkbox__indeterminate-mark" />\n      <span v-else class="vf-checkbox__mark" />',
    replace: '      <span class="vf-checkbox__mark" />',
  },
  {
    id: 'checkbox-uses-a-radio-input',
    file: checkboxSourcePath,
    description: 'the native element becomes a radio, which cannot be unchecked by clicking it',
    find: '      type="checkbox"',
    replace: '      type="radio"',
  },
  {
    id: 'checkbox-ignores-its-disabled-prop',
    file: checkboxSourcePath,
    description: 'a disabled checkbox becomes operable',
    find: '      :disabled="props.disabled"\n',
    replace: '',
  },
  {
    id: 'checkbox-drops-attribute-forwarding',
    file: checkboxSourcePath,
    description: 'inherited attrs stop reaching the input, losing id, name and required',
    find: '      v-bind="inputAttrs"\n',
    replace: '',
  },
  {
    id: 'checkbox-moves-the-consumer-class-to-the-input',
    file: checkboxSourcePath,
    description: 'the consumer class lands on the input instead of the root label',
    find: '    attrs.class as string | undefined,',
    replace: '',
  },
  {
    id: 'checkbox-drops-the-content-element',
    file: checkboxSourcePath,
    description: 'the label text disappears, leaving an unlabelled control',
    find: '    <span v-if="label || $slots.default" class="vf-checkbox__content">',
    replace: '    <span v-if="false" class="vf-checkbox__content">',
  },
];

export const radioMutations = [
  {
    id: 'radio-compares-loosely',
    file: checkableRulePath,
    description: 'strict equality becomes loose, so 1 and the string 1 select the same radio',
    find: '  return modelValue === value;',
    replace: '  return modelValue == value;',
  },
  {
    id: 'radio-emits-a-boolean-like-a-checkbox',
    file: radioSourcePath,
    description: 'the radio emits true instead of its own value, which is the checkbox contract',
    find: "  emit('update:modelValue', props.value);",
    replace: "  emit('update:modelValue', true);",
  },
  {
    id: 'radio-announces-being-unchecked',
    file: radioSourcePath,
    description: 'the early return goes, so a radio emits when another member of its group wins',
    find: '  if (!(event.target as HTMLInputElement).checked) {\n    return;\n  }\n\n',
    replace: '',
  },
  {
    id: 'radio-stops-rendering-its-value',
    file: radioSourcePath,
    description: 'the value never reaches the input, so a submitted group carries nothing',
    find: '      :value="props.value"\n',
    replace: '',
  },
  {
    id: 'radio-does-not-reflect-its-checked-state',
    file: radioSourcePath,
    description: 'the computed checked state stops reaching the input',
    find: '      :checked="isChecked"\n',
    replace: '',
  },
  {
    id: 'radio-uses-a-checkbox-input',
    file: radioSourcePath,
    description: 'the native element becomes a checkbox, so a group loses mutual exclusion',
    find: '      type="radio"',
    replace: '      type="checkbox"',
  },
  {
    id: 'radio-drops-the-checked-modifier',
    file: checkableRulePath,
    description: 'the selected member stops looking selected',
    find: "  if (checked) classes.push('vf-radio--checked');",
    replace: '',
  },
  {
    id: 'radio-ignores-its-disabled-prop',
    file: radioSourcePath,
    description: 'a disabled radio becomes operable',
    find: '      :disabled="props.disabled"\n',
    replace: '',
  },
  {
    id: 'radio-drops-attribute-forwarding',
    file: radioSourcePath,
    description: 'inherited attrs stop reaching the input, losing the group name',
    find: '      v-bind="inputAttrs"\n',
    replace: '',
  },
  {
    id: 'radio-moves-the-consumer-class-to-the-input',
    file: radioSourcePath,
    description: 'the consumer class lands on the input instead of the root label',
    find: '    attrs.class as string | undefined,',
    replace: '',
  },
];

export const switchMutations = [
  {
    id: 'switch-drops-its-role',
    file: switchSourcePath,
    description: 'the control stops calling itself a switch and reads as a plain checkbox',
    find: '      role="switch"\n',
    replace: '',
  },
  {
    id: 'switch-does-not-reflect-its-model',
    file: switchSourcePath,
    description: 'the model stops reaching the native checked state',
    find: '      :checked="props.modelValue"\n',
    replace: '',
  },
  {
    id: 'switch-stops-emitting-updates',
    file: switchSourcePath,
    description: 'toggling no longer updates the model',
    find: "  emit('update:modelValue', nextValue);",
    replace: '',
  },
  {
    id: 'switch-drops-the-static-modifier',
    file: checkableRulePath,
    description: 'the static presentation disappears',
    find: "  if (isStatic) classes.push('vf-switch--static');",
    replace: '',
  },
  {
    id: 'switch-always-emits-a-thumb-contrast',
    file: checkableRulePath,
    description: 'the auto contrast starts emitting a modifier the stylesheet never defined',
    find: "  if (thumbContrast !== 'auto') classes.push(`vf-switch--thumb-contrast-${thumbContrast}`);",
    replace: '  classes.push(`vf-switch--thumb-contrast-${thumbContrast}`);',
  },
  {
    id: 'switch-drops-the-checked-modifier',
    file: checkableRulePath,
    description: 'an on switch stops looking on',
    find: "  if (checked) classes.push('vf-switch--checked');",
    replace: '',
  },
  {
    id: 'switch-treats-whitespace-as-content',
    file: switchSourcePath,
    description: 'the VNode walk stops trimming, so a blank slot renders an empty content element',
    find: "      return String(node.children ?? '').trim().length > 0;",
    replace: "      return String(node.children ?? '').length > 0;",
  },
  {
    id: 'switch-treats-comments-as-content',
    file: switchSourcePath,
    description: 'a comment-only slot starts counting as content',
    find: '    if (node.type === Comment) {\n      return false;\n    }\n\n',
    replace: '',
  },
  {
    id: 'switch-loses-the-thumb-slot-scope',
    file: switchSourcePath,
    description: 'the thumb slot stops being told whether the switch is on',
    find: '<slot name="thumb" :checked="props.modelValue" />',
    replace: '<slot name="thumb" />',
  },
  {
    id: 'switch-ignores-its-disabled-prop',
    file: switchSourcePath,
    description: 'a disabled switch becomes operable',
    find: '      :disabled="props.disabled"\n',
    replace: '',
  },
  {
    id: 'switch-drops-attribute-forwarding',
    file: switchSourcePath,
    description: 'inherited attrs stop reaching the input',
    find: '      v-bind="inputAttrs"\n',
    replace: '',
  },
];

// Badge, Tag and Divider each get their own set. `suite` names the spec file
// whose assertions must be the ones that fail: because VfBadge and VfTag are
// near-identical, a mutation to one that only broke the other's suite would be
// a false detection, and aggregate batch failure is not evidence for a
// component (M15 plan, section 8).
export const badgeMutations = [
  {
    id: 'badge-emits-a-neutral-modifier',
    file: presentationRulePath,
    suite: 'src/components/badge/VfBadge.characterization.spec.ts',
    description: 'the neutral tone starts emitting vf-badge--neutral instead of being expressed by absence',
    find: "  const classes = ['vf-badge'];\n\n  if (tone !== 'neutral') classes.push(`vf-badge--${tone}`);",
    replace: "  const classes = ['vf-badge'];\n\n  classes.push(`vf-badge--${tone}`);",
  },
  {
    id: 'badge-drops-the-tone-modifier',
    file: presentationRulePath,
    suite: 'src/components/badge/VfBadge.characterization.spec.ts',
    description: 'a non-neutral tone stops emitting its modifier class',
    find: "  if (tone !== 'neutral') classes.push(`vf-badge--${tone}`);",
    replace: '',
  },
  {
    id: 'badge-becomes-a-tag',
    file: presentationRulePath,
    suite: 'src/components/badge/VfBadge.characterization.spec.ts',
    description: "VfTag's block name is reused for VfBadge (the substitution this batch exists to catch)",
    find: "  const classes = ['vf-badge'];\n\n  if (tone !== 'neutral') classes.push(`vf-badge--${tone}`);",
    replace: "  const classes = ['vf-tag'];\n\n  if (tone !== 'neutral') classes.push(`vf-tag--${tone}`);",
  },
  {
    id: 'badge-renders-a-div-root',
    file: badgeSourcePath,
    suite: 'src/components/badge/VfBadge.characterization.spec.ts',
    description: 'the badge root stops being an inline span',
    find: '  <span :class="classes" v-bind="attrs">\n    <slot />\n  </span>',
    replace: '  <div :class="classes" v-bind="attrs">\n    <slot />\n  </div>',
  },
  {
    id: 'badge-lets-the-caller-class-win',
    file: badgeSourcePath,
    suite: 'src/components/badge/VfBadge.characterization.spec.ts',
    description: 'attrs are bound before the class, so a caller class replaces the canonical classes',
    find: '  <span :class="classes" v-bind="attrs">',
    replace: '  <span v-bind="attrs" :class="classes">',
  },
  {
    id: 'badge-loses-its-slot',
    file: badgeSourcePath,
    suite: 'src/components/badge/VfBadge.characterization.spec.ts',
    description: 'the default slot stops rendering',
    find: '    <slot />\n',
    replace: '',
  },
];

export const tagMutations = [
  {
    id: 'tag-emits-a-neutral-modifier',
    file: presentationRulePath,
    suite: 'src/components/tag/VfTag.characterization.spec.ts',
    description: 'the neutral tone starts emitting vf-tag--neutral instead of being expressed by absence',
    find: "  const classes = ['vf-tag'];\n\n  if (tone !== 'neutral') classes.push(`vf-tag--${tone}`);",
    replace: "  const classes = ['vf-tag'];\n\n  classes.push(`vf-tag--${tone}`);",
  },
  {
    id: 'tag-drops-the-tone-modifier',
    file: presentationRulePath,
    suite: 'src/components/tag/VfTag.characterization.spec.ts',
    description: 'a non-neutral tone stops emitting its modifier class',
    find: "  if (tone !== 'neutral') classes.push(`vf-tag--${tone}`);",
    replace: '',
  },
  {
    id: 'tag-becomes-a-badge',
    file: presentationRulePath,
    suite: 'src/components/tag/VfTag.characterization.spec.ts',
    description: "VfBadge's block name is reused for VfTag (the substitution this batch exists to catch)",
    find: "  const classes = ['vf-tag'];\n\n  if (tone !== 'neutral') classes.push(`vf-tag--${tone}`);",
    replace: "  const classes = ['vf-badge'];\n\n  if (tone !== 'neutral') classes.push(`vf-badge--${tone}`);",
  },
  {
    id: 'tag-renders-a-div-root',
    file: tagSourcePath,
    suite: 'src/components/tag/VfTag.characterization.spec.ts',
    description: 'the tag root stops being an inline span',
    find: '  <span :class="classes" v-bind="attrs">\n    <slot />\n  </span>',
    replace: '  <div :class="classes" v-bind="attrs">\n    <slot />\n  </div>',
  },
  {
    id: 'tag-lets-the-caller-class-win',
    file: tagSourcePath,
    suite: 'src/components/tag/VfTag.characterization.spec.ts',
    description: 'attrs are bound before the class, so a caller class replaces the canonical classes',
    find: '  <span :class="classes" v-bind="attrs">',
    replace: '  <span v-bind="attrs" :class="classes">',
  },
  {
    id: 'tag-loses-its-slot',
    file: tagSourcePath,
    suite: 'src/components/tag/VfTag.characterization.spec.ts',
    description: 'the default slot stops rendering',
    find: '    <slot />\n',
    replace: '',
  },
];

export const dividerMutations = [
  {
    id: 'divider-renders-an-hr',
    file: dividerSourcePath,
    suite: 'src/components/divider/VfDivider.characterization.spec.ts',
    description: 'the divider is "corrected" to the conventional hr element',
    find: '  <div :class="classes" :aria-orientation="props.orientation" :role="role" v-bind="attrs" />',
    replace: '  <hr :class="classes" :aria-orientation="props.orientation" :role="role" v-bind="attrs" />',
  },
  {
    id: 'divider-always-emits-the-role',
    file: presentationRulePath,
    suite: 'src/components/divider/VfDivider.characterization.spec.ts',
    description: 'the horizontal divider is "corrected" to expose role=separator as well',
    find: "  return orientation === 'vertical' ? 'separator' : undefined;",
    replace: "  return 'separator';",
  },
  {
    id: 'divider-never-emits-the-role',
    file: presentationRulePath,
    suite: 'src/components/divider/VfDivider.characterization.spec.ts',
    description: 'the vertical divider loses role=separator',
    find: "  return orientation === 'vertical' ? 'separator' : undefined;",
    replace: '  return undefined;',
  },
  {
    id: 'divider-drops-aria-orientation',
    file: dividerSourcePath,
    suite: 'src/components/divider/VfDivider.characterization.spec.ts',
    description: 'aria-orientation is "cleaned up" off the roleless horizontal divider',
    find: ' :aria-orientation="props.orientation"',
    replace: '',
  },
  {
    id: 'divider-prevents-caller-overrides',
    file: dividerSourcePath,
    suite: 'src/components/divider/VfDivider.characterization.spec.ts',
    description: 'attrs are bound first, so a caller can no longer override role or aria-orientation',
    find: '  <div :class="classes" :aria-orientation="props.orientation" :role="role" v-bind="attrs" />',
    replace: '  <div v-bind="attrs" :class="classes" :aria-orientation="props.orientation" :role="role" />',
  },
  {
    id: 'divider-drops-the-orientation-modifier',
    file: presentationRulePath,
    suite: 'src/components/divider/VfDivider.characterization.spec.ts',
    description: 'the orientation modifier is suppressed at the default, copying the toned-span convention',
    find: "  return ['vf-divider', `vf-divider--${orientation}`];",
    replace: "  return orientation === 'horizontal' ? ['vf-divider'] : ['vf-divider', `vf-divider--${orientation}`];",
  },
];

// The three M16 components. Each set names the characterization suite that must
// be the one to fail, for the reason M15 introduced attribution: a batch is only
// worth running if one component's failure cannot stand in as another's proof.
// M16 needs it more than M15 did, because these three break in three different
// places - a template, a class rule and a branch order - and a run that merely
// went red would say nothing about which.
/**
 * VfSkeleton regressions.
 *
 * Seven of these declare `alsoFails`, and that list is the M17 child-mutation
 * isolation proof running in both directions at once. VfSkeletonGate renders
 * VfSkeleton, so a defect in the child's markup is a defect in the gate's
 * loading half - and the gate's suite failing is therefore required, not
 * tolerated. A mutation whose declared consumer suite stayed green fails the
 * gate, which is how "the gate really consumes the canonical skeleton" remains
 * a measurement rather than a claim about the source.
 *
 * The mutations *without* the declaration are as informative as the ones with
 * it. `skeleton-always-animates` and `skeleton-treats-zero-as-absent` do not
 * reach the gate, because no gate case switches the animation off or passes a
 * zero height: the gate's evidence depends on the child exactly where the gate
 * exercises the child, and nowhere else.
 *
 * Note which of these does *not* travel: the length conversion. VfSkeletonGate
 * has its own copy of that rule, deliberately duplicated in
 * shared-core/skeleton-gate/state.ts, so `skeleton-drops-the-px-suffix` changes
 * the child's height inside a gate and leaves the gate's own reserved height
 * alone. That is the two contracts staying separate while one composes the
 * other.
 */
export const skeletonMutations = [
  {
    id: 'skeleton-drops-aria-hidden',
    // Reaches VfSkeletonGate: the gate asserts the child's whole markup, aria-hidden included.
    alsoFails: [gateSuite],
    file: skeletonSourcePath,
    suite: 'src/components/skeleton/VfSkeleton.characterization.spec.ts',
    description: 'the loading placeholder stops hiding itself from the accessibility tree',
    find: ' aria-hidden="true" />',
    replace: ' />',
  },
  {
    id: 'skeleton-announces-itself',
    // Reaches VfSkeletonGate: the gate renders the child, so a child that announces itself announces inside a gate.
    alsoFails: [gateSuite],
    file: skeletonSourcePath,
    suite: 'src/components/skeleton/VfSkeleton.characterization.spec.ts',
    description: 'the skeleton is "improved" into a live region that announces loading',
    find: ' aria-hidden="true" />',
    replace: ' role="status" aria-live="polite" />',
  },
  {
    id: 'skeleton-suppresses-the-animation-modifier',
    // Reaches VfSkeletonGate: the gate has no animated prop, so the child is animated inside a gate or the contract is gone.
    alsoFails: [gateSuite],
    file: skeletonRulePath,
    suite: 'src/components/skeleton/VfSkeleton.characterization.spec.ts',
    description: 'the animation modifier is suppressed at the default, copying the M15 toned-span convention',
    find: "  if (animated) classes.push('vf-skeleton--animated');",
    replace: "  if (!animated) classes.push('vf-skeleton--animated');",
  },
  {
    id: 'skeleton-always-animates',
    file: skeletonRulePath,
    suite: 'src/components/skeleton/VfSkeleton.characterization.spec.ts',
    description: 'animated=false stops being honoured, so every skeleton shimmers',
    find: "  if (animated) classes.push('vf-skeleton--animated');",
    replace: "  classes.push('vf-skeleton--animated');",
  },
  {
    id: 'skeleton-normalises-the-empty-radius-to-zero',
    // Reaches VfSkeletonGate: the gate forwards an empty radius into the child's own empty-value rule.
    alsoFails: [gateSuite],
    file: skeletonRulePath,
    suite: 'src/components/skeleton/VfSkeleton.characterization.spec.ts',
    description: 'an empty radius is "cleaned up" into an actual border-radius:0 declaration',
    find: "  if (radius !== undefined && radius !== null && radius !== '') declarations.push(['border-radius', radius]);",
    replace:
      "  if (radius !== undefined && radius !== null) declarations.push(['border-radius', radius === '' ? '0' : radius]);",
  },
  {
    id: 'skeleton-drops-the-radius-declaration',
    // Reaches VfSkeletonGate: the token on a default gate's skeleton comes from the child's default.
    alsoFails: [gateSuite],
    file: skeletonRulePath,
    suite: 'src/components/skeleton/VfSkeleton.characterization.spec.ts',
    description: 'the radius stops reaching the style attribute at all',
    find: "  if (radius !== undefined && radius !== null && radius !== '') declarations.push(['border-radius', radius]);",
    replace: '',
  },
  {
    id: 'skeleton-drops-the-px-suffix',
    // Reaches VfSkeletonGate: the gate forwards min-height verbatim and the child converts it.
    alsoFails: [gateSuite],
    file: skeletonRulePath,
    suite: 'src/components/skeleton/VfSkeleton.characterization.spec.ts',
    description: 'a numeric minHeight reaches CSS as a bare number, which is not a length',
    find: "  return typeof value === 'number' ? `${value}px` : value;",
    replace: '  return String(value);',
  },
  {
    id: 'skeleton-treats-zero-as-absent',
    file: skeletonRulePath,
    suite: 'src/components/skeleton/VfSkeleton.characterization.spec.ts',
    description: 'minHeight 0 is dropped as falsy instead of becoming 0px',
    find: '  if (value === null || value === undefined) {',
    replace: '  if (!value) {',
  },
  {
    id: 'skeleton-renders-a-span-root',
    // Reaches VfSkeletonGate: the gate asserts the tag of the child it renders.
    alsoFails: [gateSuite],
    file: skeletonSourcePath,
    suite: 'src/components/skeleton/VfSkeleton.characterization.spec.ts',
    description: 'the skeleton root stops being a block-level div',
    find: '  <div :class="classes" :style="rootStyle" aria-hidden="true" />',
    replace: '  <span :class="classes" :style="rootStyle" aria-hidden="true" />',
  },
  {
    id: 'skeleton-stops-inheriting-attrs',
    file: skeletonSourcePath,
    suite: 'src/components/skeleton/VfSkeleton.characterization.spec.ts',
    description: 'inheritAttrs is switched off, so the consumer class, style and data attributes vanish',
    find: "defineOptions({ name: 'VfSkeleton' });",
    replace: "defineOptions({ name: 'VfSkeleton', inheritAttrs: false });",
  },
];

export const avatarMutations = [
  {
    id: 'avatar-renders-the-icon-before-the-label',
    file: avatarRulePath,
    suite: 'src/components/avatar/VfAvatar.characterization.spec.ts',
    description: 'the fallback chain is reordered to image, icon, label, slot',
    find: "  if (content.label) return 'label';\n  if (content.icon) return 'icon';",
    replace: "  if (content.icon) return 'icon';\n  if (content.label) return 'label';",
  },
  {
    id: 'avatar-renders-the-slot-before-the-icon',
    file: avatarRulePath,
    suite: 'src/components/avatar/VfAvatar.characterization.spec.ts',
    description: 'the default slot is promoted above the icon branch',
    find: "  if (content.icon) return 'icon';\n\n  return 'slot';",
    replace: "  return content.icon ? 'slot' : 'slot';",
  },
  {
    id: 'avatar-demotes-the-image',
    file: avatarRulePath,
    suite: 'src/components/avatar/VfAvatar.characterization.spec.ts',
    description: 'a label now beats an image, which is the reverse of the historical priority',
    find: "  if (content.image) return 'image';\n  if (content.label) return 'label';",
    replace: "  if (content.label) return 'label';\n  if (content.image) return 'image';",
  },
  {
    id: 'avatar-lets-an-empty-string-select-its-branch',
    file: avatarRulePath,
    suite: 'src/components/avatar/VfAvatar.characterization.spec.ts',
    description: 'presence replaces truthiness, so image="" renders an empty image instead of falling through',
    find: "  if (content.image) return 'image';",
    replace: "  if (content.image !== undefined && content.image !== null) return 'image';",
  },
  {
    id: 'avatar-emits-a-square-modifier',
    file: avatarRulePath,
    suite: 'src/components/avatar/VfAvatar.characterization.spec.ts',
    description: 'the default square shape starts emitting a modifier class',
    find: "  if (shape === 'circle') classes.push('vf-avatar--circle');",
    replace: '  classes.push(`vf-avatar--${shape}`);',
  },
  {
    id: 'avatar-emits-the-default-size-modifier',
    file: avatarRulePath,
    suite: 'src/components/avatar/VfAvatar.characterization.spec.ts',
    description: 'the md size stops being suppressed, copying the M14 checkable convention',
    find: "  if (size !== 'md') classes.push(`vf-avatar--${size}`);",
    replace: '  classes.push(`vf-avatar--${size}`);',
  },
  {
    id: 'avatar-suppresses-the-circle-modifier',
    file: avatarRulePath,
    suite: 'src/components/avatar/VfAvatar.characterization.spec.ts',
    description: 'the circle shape loses its modifier, so every avatar renders square',
    find: "  if (shape === 'circle') classes.push('vf-avatar--circle');",
    replace: '',
  },
  {
    id: 'avatar-loses-the-alt',
    file: avatarSourcePath,
    suite: 'src/components/avatar/VfAvatar.characterization.spec.ts',
    description: 'the image branch stops writing alt, turning a decorative image into an unlabelled one',
    find: ' :alt="props.imageAlt" />',
    replace: ' />',
  },
  {
    id: 'avatar-exposes-the-decorative-glyph',
    file: avatarSourcePath,
    suite: 'src/components/avatar/VfAvatar.characterization.spec.ts',
    description: 'the icon loses aria-hidden, so an icon-only avatar starts announcing its glyph',
    find: ':icon="props.icon" aria-hidden="true" />',
    replace: ':icon="props.icon" />',
  },
  {
    id: 'avatar-lets-the-caller-class-win',
    file: avatarSourcePath,
    suite: 'src/components/avatar/VfAvatar.characterization.spec.ts',
    description: 'attrs are bound before the class, so a caller class replaces the canonical classes',
    find: '  <span :class="classes" v-bind="attrs">',
    replace: '  <span v-bind="attrs" :class="classes">',
  },
  {
    id: 'avatar-renders-the-slot-alongside-every-branch',
    file: avatarSourcePath,
    suite: 'src/components/avatar/VfAvatar.characterization.spec.ts',
    description: 'the slot loses its v-else, so it renders next to the image, the label or the glyph',
    find: '    <slot v-else />',
    replace: '    <slot />',
  },
];

export const cardMutations = [
  {
    id: 'card-header-gains-a-class',
    file: cardSourcePath,
    suite: 'src/components/card/VfCard.characterization.spec.ts',
    description: 'the unclassed header wrapper gains the vf-card__header class it historically lacks',
    find: '    <header v-if="regions.header">',
    replace: '    <header v-if="regions.header" class="vf-card__header">',
  },
  {
    id: 'card-footer-gains-a-class',
    file: cardSourcePath,
    suite: 'src/components/card/VfCard.characterization.spec.ts',
    description: 'the unclassed footer wrapper gains the vf-card__footer class it historically lacks',
    find: '    <footer v-if="regions.footer">',
    replace: '    <footer v-if="regions.footer" class="vf-card__footer">',
  },
  {
    id: 'card-header-becomes-a-div',
    file: cardSourcePath,
    suite: 'src/components/card/VfCard.characterization.spec.ts',
    description: 'the native header element is replaced by a generic div, losing its implicit semantics',
    find: '    <header v-if="regions.header">\n      <slot name="header">\n        <h3 class="vf-card__title">{{ props.title }}</h3>\n      </slot>\n    </header>',
    replace:
      '    <div v-if="regions.header">\n      <slot name="header">\n        <h3 class="vf-card__title">{{ props.title }}</h3>\n      </slot>\n    </div>',
  },
  {
    id: 'card-drops-the-body-wrapper',
    file: cardSourcePath,
    suite: 'src/components/card/VfCard.characterization.spec.ts',
    description: 'the classed body wrapper disappears and the default slot renders bare',
    find: '    <div v-if="regions.body" class="vf-card__body">\n      <slot />\n    </div>',
    replace: '    <slot />',
  },
  {
    id: 'card-reorders-the-regions',
    file: cardSourcePath,
    suite: 'src/components/card/VfCard.characterization.spec.ts',
    description: 'the footer is rendered before the body',
    find: '    <div v-if="regions.body" class="vf-card__body">\n      <slot />\n    </div>\n\n    <footer v-if="regions.footer">\n      <slot name="footer" />\n    </footer>',
    replace:
      '    <footer v-if="regions.footer">\n      <slot name="footer" />\n    </footer>\n\n    <div v-if="regions.body" class="vf-card__body">\n      <slot />\n    </div>',
  },
  {
    id: 'card-lets-the-caller-class-win',
    file: cardSourcePath,
    suite: 'src/components/card/VfCard.characterization.spec.ts',
    description: 'attrs are bound before the class, so a caller class replaces the canonical classes',
    find: '  <section :class="classes" v-bind="attrs">',
    replace: '  <section v-bind="attrs" :class="classes">',
  },
  {
    id: 'card-opens-the-header-for-an-empty-title',
    file: cardRulePath,
    suite: 'src/components/card/VfCard.characterization.spec.ts',
    description: 'presence replaces truthiness, so title="" renders an empty header',
    find: '    header: Boolean(input.title) || input.hasHeaderSlot,',
    replace: '    header: input.title !== undefined || input.hasHeaderSlot,',
  },
  {
    // `headerTitle` has no Vue mutation here on purpose: the Vue template never
    // reads it. The compiler answers that question through slot fallback, so
    // the field exists only for the Razor adapter, and breaking it changes
    // nothing the Vue suite can observe. It is covered by the shared vectors
    // and by CardComponentTest instead. Writing a Vue mutation for it anyway
    // would produce a mutation that can never be detected, which the driver
    // would report as MISSED - correctly.
    id: 'card-keys-the-body-on-the-footer-slot',
    file: cardRulePath,
    suite: 'src/components/card/VfCard.characterization.spec.ts',
    description: "the body and footer wrappers are keyed on each other's slots",
    find: '    body: input.hasDefaultSlot,\n    footer: input.hasFooterSlot,',
    replace: '    body: input.hasFooterSlot,\n    footer: input.hasDefaultSlot,',
  },
  {
    id: 'card-drops-the-compact-modifier',
    file: cardRulePath,
    suite: 'src/components/card/VfCard.characterization.spec.ts',
    description: 'the compact prop stops reaching the class list',
    find: "  if (compact) classes.push('vf-card--compact');",
    replace: '',
  },
  {
    id: 'card-becomes-a-panel',
    file: cardRulePath,
    suite: 'src/components/card/VfCard.characterization.spec.ts',
    description: "VfPanel's block name is reused for VfCard (the substitution the unmigrated neighbour makes possible)",
    find: "  const classes = ['vf-card'];\n\n  if (compact) classes.push('vf-card--compact');",
    replace: "  const classes = ['vf-panel'];\n\n  if (compact) classes.push('vf-panel--subtle');",
  },
];

/**
 * VfPanel regressions.
 *
 * The M18 set, and the first written against a neighbour. VfCard renders nearly
 * the same markup, so the mutations that carry this milestone are the ones that
 * turn a panel into a card:
 *
 *   - `panel-wraps-its-content-in-a-card-body` adds the classed wrapper the card
 *     has. The rendered panel looks almost identical and selects entirely
 *     differently, and an empty default slot gains a row and a gap;
 *   - `panel-grows-a-footer` starts rendering the footer slot a panel drops;
 *   - `panel-becomes-a-card` and `panel-modifier-becomes-compact` reuse the
 *     neighbour's block name and modifier.
 *
 * Every one of these fails VfPanel's own suite and none of them touches VfCard's
 * source or its rules, which is the cross-isolation the milestone asks for.
 */
export const panelMutations = [
  {
    id: 'panel-wraps-its-content-in-a-card-body',
    file: panelSourcePath,
    suite: 'src/components/panel/VfPanel.characterization.spec.ts',
    description: "VfCard's classed body wrapper appears around the panel's default slot",
    find: '    <slot />\n  </section>',
    replace: '    <div class="vf-panel__body"><slot /></div>\n  </section>',
  },
  {
    id: 'panel-keys-its-content-on-the-slot',
    file: panelSourcePath,
    suite: 'src/components/panel/VfPanel.characterization.spec.ts',
    description: 'the default slot gains the presence condition a card wraps its body in',
    find: '    <slot />\n  </section>',
    replace: '    <slot v-if="$slots.default" />\n  </section>',
  },
  {
    id: 'panel-grows-a-footer',
    file: panelSourcePath,
    suite: 'src/components/panel/VfPanel.characterization.spec.ts',
    description: 'the footer slot a panel drops starts rendering a footer element',
    find: '    <slot />\n  </section>',
    replace:
      '    <slot />\n\n    <footer v-if="$slots.footer">\n      <slot name="footer" />\n    </footer>\n  </section>',
  },
  {
    id: 'panel-header-gains-a-class',
    file: panelSourcePath,
    suite: 'src/components/panel/VfPanel.characterization.spec.ts',
    description: 'the unclassed header wrapper gains the vf-panel__header class it historically lacks',
    find: '    <header v-if="regions.header">',
    replace: '    <header v-if="regions.header" class="vf-panel__header">',
  },
  {
    id: 'panel-header-becomes-a-div',
    file: panelSourcePath,
    suite: 'src/components/panel/VfPanel.characterization.spec.ts',
    description: 'the native header element is replaced by a generic div, losing its implicit semantics',
    find:
      '    <header v-if="regions.header">\n      <slot name="header">\n' +
      '        <h3 class="vf-panel__title">{{ props.title }}</h3>\n      </slot>\n    </header>',
    replace:
      '    <div v-if="regions.header">\n      <slot name="header">\n' +
      '        <h3 class="vf-panel__title">{{ props.title }}</h3>\n      </slot>\n    </div>',
  },
  {
    id: 'panel-title-becomes-a-card-title',
    file: panelSourcePath,
    suite: 'src/components/panel/VfPanel.characterization.spec.ts',
    description: "the fallback heading is classed with the neighbour's block name",
    find: '        <h3 class="vf-panel__title">{{ props.title }}</h3>',
    replace: '        <h3 class="vf-card__title">{{ props.title }}</h3>',
  },
  {
    id: 'panel-drops-the-title-fallback',
    file: panelSourcePath,
    suite: 'src/components/panel/VfPanel.characterization.spec.ts',
    description: 'the header slot loses its fallback content, so a title alone renders an empty header',
    find: '      <slot name="header">\n        <h3 class="vf-panel__title">{{ props.title }}</h3>\n      </slot>',
    replace: '      <slot name="header" />',
  },
  {
    id: 'panel-reorders-the-header-and-the-content',
    file: panelSourcePath,
    suite: 'src/components/panel/VfPanel.characterization.spec.ts',
    description: 'the default slot is rendered before the header',
    find:
      '    <header v-if="regions.header">\n      <slot name="header">\n' +
      '        <h3 class="vf-panel__title">{{ props.title }}</h3>\n      </slot>\n    </header>\n\n    <slot />',
    replace:
      '    <slot />\n\n    <header v-if="regions.header">\n      <slot name="header">\n' +
      '        <h3 class="vf-panel__title">{{ props.title }}</h3>\n      </slot>\n    </header>',
  },
  {
    id: 'panel-lets-the-caller-class-win',
    file: panelSourcePath,
    suite: 'src/components/panel/VfPanel.characterization.spec.ts',
    description: 'attrs are bound before the class, so a caller class replaces the canonical classes',
    find: '  <section :class="classes" v-bind="attrs">',
    replace: '  <section v-bind="attrs" :class="classes">',
  },
  {
    // The whole template block, because both tags have to move together: an SFC
    // whose root opens as a div and closes as a section does not compile, and a
    // mutation that breaks the compiler proves nothing about the suite.
    id: 'panel-root-becomes-a-div',
    file: panelSourcePath,
    suite: 'src/components/panel/VfPanel.characterization.spec.ts',
    description: 'the section root becomes a div, which looks identical and exposes a different element',
    find:
      '  <section :class="classes" v-bind="attrs">\n' +
      '    <header v-if="regions.header">\n      <slot name="header">\n' +
      '        <h3 class="vf-panel__title">{{ props.title }}</h3>\n      </slot>\n    </header>\n\n' +
      '    <slot />\n  </section>',
    replace:
      '  <div :class="classes" v-bind="attrs">\n' +
      '    <header v-if="regions.header">\n      <slot name="header">\n' +
      '        <h3 class="vf-panel__title">{{ props.title }}</h3>\n      </slot>\n    </header>\n\n' +
      '    <slot />\n  </div>',
  },
  {
    id: 'panel-opens-the-header-for-an-empty-title',
    file: panelRulePath,
    suite: 'src/components/panel/VfPanel.characterization.spec.ts',
    description: 'presence replaces truthiness, so title="" renders an empty header',
    find: '    header: Boolean(input.title) || input.hasHeaderSlot,',
    replace: '    header: input.title !== undefined || input.hasHeaderSlot,',
  },
  {
    id: 'panel-drops-the-subtle-modifier',
    file: panelRulePath,
    suite: 'src/components/panel/VfPanel.characterization.spec.ts',
    description: 'the subtle prop stops reaching the class list',
    find: "  if (subtle) classes.push('vf-panel--subtle');",
    replace: '',
  },
  {
    id: 'panel-modifier-becomes-compact',
    file: panelRulePath,
    suite: 'src/components/panel/VfPanel.characterization.spec.ts',
    description: "the modifier is spelled as VfCard's compact, which no panel stylesheet defines",
    find: "  if (subtle) classes.push('vf-panel--subtle');",
    replace: "  if (subtle) classes.push('vf-panel--compact');",
  },
  {
    id: 'panel-becomes-a-card',
    file: panelRulePath,
    suite: 'src/components/panel/VfPanel.characterization.spec.ts',
    description: "VfCard's block name is reused for VfPanel (the substitution the adjacent component makes possible)",
    find: "  const classes = ['vf-panel'];\n\n  if (subtle) classes.push('vf-panel--subtle');",
    replace: "  const classes = ['vf-card'];\n\n  if (subtle) classes.push('vf-card--compact');",
  },
];

/**
 * VfAlert regressions.
 *
 * The M19 set. The reference alert owns a semantic role and no interaction, so
 * the mutations that carry this milestone are the ones a migration would call
 * improvements:
 *
 *   - `alert-grows-a-dismiss-button` adds the close button every other design
 *     system's alert has. There is no prop to key it on because the reference
 *     has none, so it is always rendered - and every "no interactive element
 *     of its own" assertion fails;
 *   - `alert-declares-a-dismiss-emit` gives the component an event contract it
 *     never had;
 *   - `alert-tone-changes-the-role` and `alert-gains-a-live-region` turn tone
 *     into semantics;
 *   - `alert-uses-the-badge-resolver` borrows VfBadge's class rule, which
 *     differs at exactly two tones and in the block name everywhere.
 *
 * Every one of these fails VfAlert's own suite and none of them touches
 * VfBadge's or VfTag's source or rules.
 */
export const alertMutations = [
  {
    id: 'alert-grows-a-dismiss-button',
    file: alertSourcePath,
    suite: 'src/components/alert/VfAlert.characterization.spec.ts',
    description: 'a component-owned close button is rendered after the content - the control the reference never had',
    find: '      <div class="vf-alert__body">\n        <slot />\n      </div>\n    </div>\n  </section>',
    replace:
      '      <div class="vf-alert__body">\n        <slot />\n      </div>\n    </div>\n' +
      '    <button type="button" class="vf-alert__dismiss" aria-label="Dismiss">×</button>\n  </section>',
  },
  {
    id: 'alert-declares-a-dismiss-emit',
    file: alertSourcePath,
    suite: 'src/components/alert/VfAlert.characterization.spec.ts',
    description: 'the component declares a dismiss event it never emitted',
    find: 'const attrs = useAttrs();\nconst slots = useSlots();',
    replace: 'defineEmits<{ dismiss: [] }>();\n\nconst attrs = useAttrs();\nconst slots = useSlots();',
  },
  {
    id: 'alert-root-becomes-a-status',
    file: alertSourcePath,
    suite: 'src/components/alert/VfAlert.characterization.spec.ts',
    description: 'the section writes role=status instead of role=alert',
    find: '  <section :class="classes" role="alert" v-bind="attrs">',
    replace: '  <section :class="classes" role="status" v-bind="attrs">',
  },
  {
    id: 'alert-tone-changes-the-role',
    file: alertSourcePath,
    suite: 'src/components/alert/VfAlert.characterization.spec.ts',
    description: 'tone starts carrying semantics: danger and warn stay alerts, every other tone becomes a status',
    find: '  <section :class="classes" role="alert" v-bind="attrs">',
    replace:
      "  <section :class=\"classes\" :role=\"props.tone === 'danger' || props.tone === 'warn' ? 'alert' : 'status'\" v-bind=\"attrs\">",
  },
  {
    id: 'alert-gains-a-live-region',
    file: alertSourcePath,
    suite: 'src/components/alert/VfAlert.characterization.spec.ts',
    description: 'the section writes aria-live and aria-atomic of its own beside the role',
    find: '  <section :class="classes" role="alert" v-bind="attrs">',
    replace: '  <section :class="classes" role="alert" aria-live="assertive" aria-atomic="true" v-bind="attrs">',
  },
  {
    id: 'alert-names-itself',
    file: alertSourcePath,
    suite: 'src/components/alert/VfAlert.characterization.spec.ts',
    description: 'the section labels itself with the title, which the reference never does',
    find: '  <section :class="classes" role="alert" v-bind="attrs">',
    replace: '  <section :class="classes" role="alert" :aria-label="props.title" v-bind="attrs">',
  },
  {
    id: 'alert-lets-its-own-role-beat-the-consumer',
    file: alertSourcePath,
    suite: 'src/components/alert/VfAlert.characterization.spec.ts',
    description: 'the role is bound after the attrs, so a consumer role no longer replaces it',
    find: '  <section :class="classes" role="alert" v-bind="attrs">',
    replace: '  <section :class="classes" v-bind="attrs" role="alert">',
  },
  {
    id: 'alert-lets-the-caller-class-win',
    file: alertSourcePath,
    suite: 'src/components/alert/VfAlert.characterization.spec.ts',
    description: 'attrs are bound before the class, so a caller class replaces the canonical classes',
    find: '  <section :class="classes" role="alert" v-bind="attrs">',
    replace: '  <section v-bind="attrs" :class="classes" role="alert">',
  },
  {
    id: 'alert-moves-attrs-to-the-content-wrapper',
    file: alertSourcePath,
    suite: 'src/components/alert/VfAlert.characterization.spec.ts',
    description: 'forwarded attrs land on the content wrapper rather than on the section',
    find:
      '  <section :class="classes" role="alert" v-bind="attrs">\n' +
      '    <div v-if="regions.icon" class="vf-alert__icon" aria-hidden="true">\n' +
      '      <slot name="icon">\n' +
      '        <VueIconify :icon="iconName" size="var(--vf-icon-size-lg)" />\n' +
      '      </slot>\n' +
      '    </div>\n\n' +
      '    <div class="vf-alert__content">',
    replace:
      '  <section :class="classes" role="alert">\n' +
      '    <div v-if="regions.icon" class="vf-alert__icon" aria-hidden="true">\n' +
      '      <slot name="icon">\n' +
      '        <VueIconify :icon="iconName" size="var(--vf-icon-size-lg)" />\n' +
      '      </slot>\n' +
      '    </div>\n\n' +
      '    <div class="vf-alert__content" v-bind="attrs">',
  },
  {
    // The whole template block, because both tags have to move together: an
    // SFC whose root opens as a div and closes as a section does not compile.
    id: 'alert-root-becomes-a-div',
    file: alertSourcePath,
    suite: 'src/components/alert/VfAlert.characterization.spec.ts',
    description: 'the section root becomes a div, which looks identical and exposes a different element',
    find:
      '  <section :class="classes" role="alert" v-bind="attrs">\n' +
      '    <div v-if="regions.icon" class="vf-alert__icon" aria-hidden="true">\n' +
      '      <slot name="icon">\n' +
      '        <VueIconify :icon="iconName" size="var(--vf-icon-size-lg)" />\n' +
      '      </slot>\n' +
      '    </div>\n\n' +
      '    <div class="vf-alert__content">\n' +
      '      <p v-if="regions.title" class="vf-alert__title">\n' +
      '        <slot name="title">\n' +
      '          {{ props.title }}\n' +
      '        </slot>\n' +
      '      </p>\n\n' +
      '      <div class="vf-alert__body">\n' +
      '        <slot />\n' +
      '      </div>\n' +
      '    </div>\n' +
      '  </section>',
    replace:
      '  <div :class="classes" role="alert" v-bind="attrs">\n' +
      '    <div v-if="regions.icon" class="vf-alert__icon" aria-hidden="true">\n' +
      '      <slot name="icon">\n' +
      '        <VueIconify :icon="iconName" size="var(--vf-icon-size-lg)" />\n' +
      '      </slot>\n' +
      '    </div>\n\n' +
      '    <div class="vf-alert__content">\n' +
      '      <p v-if="regions.title" class="vf-alert__title">\n' +
      '        <slot name="title">\n' +
      '          {{ props.title }}\n' +
      '        </slot>\n' +
      '      </p>\n\n' +
      '      <div class="vf-alert__body">\n' +
      '        <slot />\n' +
      '      </div>\n' +
      '    </div>\n' +
      '  </div>',
  },
  {
    id: 'alert-icon-stops-being-decorative',
    file: alertSourcePath,
    suite: 'src/components/alert/VfAlert.characterization.spec.ts',
    description: 'aria-hidden leaves the icon container, so the glyph enters the accessibility tree',
    find: '    <div v-if="regions.icon" class="vf-alert__icon" aria-hidden="true">',
    replace: '    <div v-if="regions.icon" class="vf-alert__icon">',
  },
  {
    id: 'alert-hides-the-glyph-twice',
    file: alertSourcePath,
    suite: 'src/components/alert/VfAlert.characterization.spec.ts',
    description: 'aria-hidden is passed to the glyph as well as written on the container',
    find: '        <VueIconify :icon="iconName" size="var(--vf-icon-size-lg)" />',
    replace: '        <VueIconify :icon="iconName" size="var(--vf-icon-size-lg)" aria-hidden="true" />',
  },
  {
    id: 'alert-glyph-loses-the-large-size',
    file: alertSourcePath,
    suite: 'src/components/alert/VfAlert.characterization.spec.ts',
    description: "the glyph is rendered at the icon package's default size rather than the large size",
    find: '        <VueIconify :icon="iconName" size="var(--vf-icon-size-lg)" />',
    replace: '        <VueIconify :icon="iconName" />',
  },
  {
    id: 'alert-always-renders-the-icon',
    file: alertSourcePath,
    suite: 'src/components/alert/VfAlert.characterization.spec.ts',
    description: 'hideIcon stops removing the container',
    find: '    <div v-if="regions.icon" class="vf-alert__icon" aria-hidden="true">',
    replace: '    <div class="vf-alert__icon" aria-hidden="true">',
  },
  {
    id: 'alert-title-becomes-a-heading',
    file: alertSourcePath,
    suite: 'src/components/alert/VfAlert.characterization.spec.ts',
    description: 'the title paragraph becomes an h3, adding a heading to every alert',
    find:
      '      <p v-if="regions.title" class="vf-alert__title">\n        <slot name="title">\n' +
      '          {{ props.title }}\n        </slot>\n      </p>',
    replace:
      '      <h3 v-if="regions.title" class="vf-alert__title">\n        <slot name="title">\n' +
      '          {{ props.title }}\n        </slot>\n      </h3>',
  },
  {
    id: 'alert-drops-the-title-fallback',
    file: alertSourcePath,
    suite: 'src/components/alert/VfAlert.characterization.spec.ts',
    description: 'the title slot loses its fallback content, so a title prop alone renders an empty paragraph',
    find: '        <slot name="title">\n          {{ props.title }}\n        </slot>',
    replace: '        <slot name="title" />',
  },
  {
    id: 'alert-keys-the-body-on-the-slot',
    file: alertSourcePath,
    suite: 'src/components/alert/VfAlert.characterization.spec.ts',
    description: 'the unconditional body wrapper starts rendering only when the default slot was passed',
    find: '      <div class="vf-alert__body">\n        <slot />\n      </div>',
    replace: '      <div v-if="$slots.default" class="vf-alert__body">\n        <slot />\n      </div>',
  },
  {
    id: 'alert-body-gains-a-role',
    file: alertSourcePath,
    suite: 'src/components/alert/VfAlert.characterization.spec.ts',
    description: 'the body wrapper starts exposing a role of its own, where the reference exposes none',
    find: '      <div class="vf-alert__body">\n        <slot />\n      </div>',
    replace: '      <div class="vf-alert__body" role="status">\n        <slot />\n      </div>',
  },
  {
    id: 'alert-uses-the-badge-resolver',
    file: alertSourcePath,
    suite: 'src/components/alert/VfAlert.characterization.spec.ts',
    description: "the class list is derived from VfBadge's rule - the substitution the shared tone vocabulary invites",
    find: "import { resolveAlertClasses, resolveAlertIcon, resolveAlertRegions } from '@codemonster-ru/vueforge-shared-core';",
    replace:
      "import { resolveBadgeClasses, resolveAlertIcon, resolveAlertRegions } from '@codemonster-ru/vueforge-shared-core';\n" +
      'const resolveAlertClasses = resolveBadgeClasses;',
  },
  {
    id: 'alert-changes-the-default-tone',
    file: alertSourcePath,
    suite: 'src/components/alert/VfAlert.characterization.spec.ts',
    description: 'the default tone becomes neutral, so a bare alert emits a modifier it never emitted',
    find: "  tone: 'primary',\n  title: undefined,",
    replace: "  tone: 'neutral',\n  title: undefined,",
  },
  {
    id: 'alert-suppresses-neutral-instead-of-primary',
    file: alertRulePath,
    suite: 'src/components/alert/VfAlert.characterization.spec.ts',
    description: "the tone rule suppresses neutral rather than primary - VfBadge's rule under the alert's block name",
    find: "  if (tone !== 'primary') classes.push(`vf-alert--${tone}`);",
    replace: "  if (tone !== 'neutral') classes.push(`vf-alert--${tone}`);",
  },
  {
    id: 'alert-drops-the-danger-modifier',
    file: alertRulePath,
    suite: 'src/components/alert/VfAlert.characterization.spec.ts',
    description: 'one tone stops reaching the class list',
    find: "  if (tone !== 'primary') classes.push(`vf-alert--${tone}`);",
    replace: "  if (tone !== 'primary' && tone !== 'danger') classes.push(`vf-alert--${tone}`);",
  },
  {
    id: 'alert-becomes-a-badge',
    file: alertRulePath,
    suite: 'src/components/alert/VfAlert.characterization.spec.ts',
    description: "VfBadge's block name is reused for VfAlert",
    find: "  const classes = ['vf-alert'];\n\n  if (tone !== 'primary') classes.push(`vf-alert--${tone}`);",
    replace: "  const classes = ['vf-badge'];\n\n  if (tone !== 'neutral') classes.push(`vf-badge--${tone}`);",
  },
  {
    id: 'alert-success-falls-back-to-the-info-glyph',
    file: alertRulePath,
    suite: 'src/components/alert/VfAlert.characterization.spec.ts',
    description: 'the success tone loses its glyph and falls to the default',
    find: "    case 'success':\n      return 'check-circle';",
    replace: "    case 'success':\n      return 'info-circle';",
  },
  {
    id: 'alert-tests-the-icon-for-truthiness',
    file: alertRulePath,
    suite: 'src/components/alert/VfAlert.characterization.spec.ts',
    description: 'an empty icon prop falls back to the tone glyph rather than being passed through as a name',
    find: '  if (input.icon !== undefined && input.icon !== null) return input.icon;',
    replace: '  if (input.icon) return input.icon;',
  },
  {
    id: 'alert-opens-the-title-for-an-empty-string',
    file: alertRulePath,
    suite: 'src/components/alert/VfAlert.characterization.spec.ts',
    description: 'presence replaces truthiness, so title="" renders an empty paragraph',
    find: '    title: Boolean(input.title) || input.hasTitleSlot,',
    replace: '    title: input.title !== undefined || input.hasTitleSlot,',
  },
  {
    id: 'alert-keys-the-icon-on-the-slot-too',
    file: alertRulePath,
    suite: 'src/components/alert/VfAlert.characterization.spec.ts',
    description: 'hideIcon stops discarding a consumer icon slot',
    find: '    icon: !input.hideIcon,',
    replace: '    icon: !input.hideIcon || input.hasIconSlot,',
  },
];

/**
 * VfSkeletonGate regressions.
 *
 * The first migrated component that renders another, so the list has two halves
 * that must stay distinguishable: defects in what the gate composes, and defects
 * in what it hands the child. A mutation in the second half has to fail the
 * gate's suite *without* failing VfSkeleton's, or the two components' evidence
 * has collapsed into one.
 *
 * The most valuable ones here are the mutations that produce plausible markup.
 * `gate-uses-v-if` renders correctly in both states and destroys consumer DOM on
 * every change; `gate-hardcodes-the-child-radius` is byte-identical at the
 * default and diverges only where the child's own empty-value rule applies.
 */
export const skeletonGateMutations = [
  {
    id: 'gate-inverts-the-overlay-predicate',
    file: skeletonGateSourcePath,
    suite: gateSuite,
    description: 'the overlay is shown when ready and hidden when loading',
    find: '<div v-show="!ready" class="vf-skeleton-gate__overlay"',
    replace: '<div v-show="ready" class="vf-skeleton-gate__overlay"',
  },
  {
    id: 'gate-inverts-the-busy-predicate',
    file: skeletonGateSourcePath,
    suite: gateSuite,
    description: 'aria-busy is announced on a settled gate and dropped on a loading one',
    find: '<div class="vf-skeleton-gate" :style="rootStyle" :aria-busy="!ready || undefined">',
    replace: '<div class="vf-skeleton-gate" :style="rootStyle" :aria-busy="ready || undefined">',
  },
  {
    id: 'gate-writes-aria-busy-false',
    file: skeletonGateSourcePath,
    suite: gateSuite,
    description: 'a settled gate announces aria-busy="false" instead of dropping the attribute',
    find: ':aria-busy="!ready || undefined">',
    replace: ':aria-busy="String(!ready)">',
  },
  {
    id: 'gate-uses-v-if-instead-of-v-show',
    file: skeletonGateSourcePath,
    suite: gateSuite,
    description: 'the overlay becomes a real branch, so a settled gate unmounts its skeleton',
    find: '<div v-show="!ready" class="vf-skeleton-gate__overlay"',
    replace: '<div v-if="!ready" class="vf-skeleton-gate__overlay"',
  },
  {
    id: 'gate-renders-the-skeleton-in-both-halves',
    file: skeletonGateSourcePath,
    suite: gateSuite,
    description: 'a second skeleton is drawn inside the content wrapper',
    find: '      <slot />\n    </div>',
    replace: '      <slot />\n      <VfSkeleton :min-height="minHeight" :radius="radius" />\n    </div>',
  },
  {
    id: 'gate-renders-the-content-in-both-halves',
    file: skeletonGateSourcePath,
    suite: gateSuite,
    description: 'the consumer content is drawn inside the overlay as well',
    find: '      <slot name="skeleton">',
    replace: '      <slot />\n      <slot name="skeleton">',
  },
  {
    id: 'gate-duplicates-the-consumer-content',
    file: skeletonGateSourcePath,
    suite: gateSuite,
    description: 'the default slot is rendered twice',
    find: '      <slot />\n    </div>',
    replace: '      <slot />\n      <slot />\n    </div>',
  },
  {
    id: 'gate-adds-a-wrapper-around-the-content',
    file: skeletonGateSourcePath,
    suite: gateSuite,
    description: 'an extra element appears between the content wrapper and the consumer content',
    find: '      <slot />\n    </div>',
    replace: '      <div class="vf-skeleton-gate__inner"><slot /></div>\n    </div>',
  },
  {
    id: 'gate-drops-the-inert-attribute',
    file: skeletonGateSourcePath,
    suite: gateSuite,
    description: 'faded content stays reachable by pointer and keyboard underneath the skeleton',
    find: '      :inert="!ready ? true : undefined"\n',
    replace: '',
  },
  {
    id: 'gate-drops-the-content-aria-hidden',
    file: skeletonGateSourcePath,
    suite: gateSuite,
    description: 'faded content stays in the accessibility tree while the skeleton is shown',
    find: '      :aria-hidden="!ready || undefined"\n',
    replace: '',
  },
  {
    id: 'gate-drops-the-overlay-aria-hidden',
    file: skeletonGateSourcePath,
    suite: gateSuite,
    description: 'the skeleton stops being hidden from assistive technology',
    find: 'class="vf-skeleton-gate__overlay" :style="overlayStyle" aria-hidden="true">',
    replace: 'class="vf-skeleton-gate__overlay" :style="overlayStyle">',
  },
  {
    id: 'gate-drops-the-empty-content-style-binding',
    file: skeletonGateSourcePath,
    suite: gateSuite,
    description: "the always-empty content style binding is tidied away, changing every gate's server output",
    find: '      :style="contentStyle"\n',
    replace: '',
  },
  // What reaches the child. These four are the composition contract, and each
  // must fail the gate's suite while leaving VfSkeleton's untouched.
  {
    id: 'gate-drops-the-forwarded-radius',
    file: skeletonGateSourcePath,
    suite: gateSuite,
    description: 'the radius stops reaching the child, so a rounded gate holds a square skeleton',
    find: '<VfSkeleton :min-height="minHeight" :radius="radius" />',
    replace: '<VfSkeleton :min-height="minHeight" />',
  },
  {
    id: 'gate-drops-the-forwarded-min-height',
    file: skeletonGateSourcePath,
    suite: gateSuite,
    description: 'the min-height stops reaching the child',
    find: '<VfSkeleton :min-height="minHeight" :radius="radius" />',
    replace: '<VfSkeleton :radius="radius" />',
  },
  {
    id: 'gate-hardcodes-the-child-radius-default',
    file: skeletonGateSourcePath,
    suite: gateSuite,
    description: "the gate supplies the child's default token itself instead of letting the child supply it",
    find: '<VfSkeleton :min-height="minHeight" :radius="radius" />',
    replace: '<VfSkeleton :min-height="minHeight" :radius="radius || \'var(--vf-radius-surface)\'" />',
  },
  {
    id: 'gate-forwards-the-resolved-height-to-the-child',
    file: skeletonGateSourcePath,
    suite: gateSuite,
    description: 'the child is asked for the reserved height rather than the min-height, so the two stop disagreeing',
    find: '<VfSkeleton :min-height="minHeight" :radius="radius" />',
    replace: '<VfSkeleton :min-height="resolvedMinHeight" :radius="radius" />',
  },
  {
    id: 'gate-forwards-consumer-attributes-to-the-child',
    file: skeletonGateSourcePath,
    suite: gateSuite,
    description: "the consumer's attributes are passed down to the skeleton as well as onto the root",
    find: '<VfSkeleton :min-height="minHeight" :radius="radius" />',
    replace: '<VfSkeleton v-bind="$attrs" :min-height="minHeight" :radius="radius" />',
  },
  // The shared rules, which the Razor adapter derives from the same file.
  {
    id: 'gate-reserve-uses-truthiness',
    file: skeletonGateRulePath,
    suite: gateSuite,
    description:
      'the reserve precedence becomes a truthiness check, so zero stops reserving and empty starts falling through',
    find: '  if (reserve !== undefined) {',
    replace: '  if (reserve) {',
  },
  {
    id: 'gate-reserve-is-checked-before-conversion',
    file: skeletonGateRulePath,
    suite: gateSuite,
    description:
      'the reserve is checked before the length conversion, so a zero reserve is read as a number rather than a length',
    find: '  const reserve = resolveSkeletonGateLength(reserveHeight);\n  if (reserve !== undefined) {',
    replace:
      "  const reserve = reserveHeight === null || reserveHeight === undefined ? undefined : resolveSkeletonGateLength(reserveHeight);\n  if (reserve !== undefined && reserve !== '') {",
  },
  {
    id: 'gate-measured-height-ignores-ready',
    file: skeletonGateRulePath,
    suite: gateSuite,
    description: 'the preserved height keeps applying once content has appeared',
    find: '  if (preserveLastHeight && measuredContentHeight !== null && !ready) {',
    replace: '  if (preserveLastHeight && measuredContentHeight !== null) {',
  },
  {
    id: 'gate-drops-empty-style-values',
    file: skeletonGateRulePath,
    suite: gateSuite,
    description: "the rule drops empty values itself, changing the reference's server output",
    find: "  if (minHeight !== undefined) declarations.push(['min-height', minHeight]);",
    replace: "  if (minHeight !== undefined && minHeight !== '') declarations.push(['min-height', minHeight]);",
  },
  {
    id: 'gate-omits-the-fade-duration-at-the-default',
    file: skeletonGateRulePath,
    suite: gateSuite,
    description: 'the fade duration is written only when it differs from the default token value',
    find: "  declarations.push(['--vf-skeleton-gate-fade-duration', `${fadeDuration}ms`]);",
    replace:
      "  if (fadeDuration !== 220) declarations.push(['--vf-skeleton-gate-fade-duration', `${fadeDuration}ms`]);",
  },
  {
    id: 'gate-overlay-receives-the-reserved-height',
    file: skeletonGateRulePath,
    suite: gateSuite,
    description: 'the overlay starts carrying declarations that belong to the root only',
    find: "  return [['border-radius', radius]];",
    replace: "  return [['border-radius', radius], ['min-height', 'inherit']];",
  },
  {
    id: 'gate-content-loses-the-ready-modifier',
    file: skeletonGateRulePath,
    suite: gateSuite,
    description: 'the content wrapper never gets the modifier the stylesheet fades on',
    find: "  if (ready) classes.push('vf-skeleton-gate__content--ready');",
    replace: "  if (!ready) classes.push('vf-skeleton-gate__content--ready');",
  },
  {
    id: 'gate-content-modifier-order-swaps',
    file: skeletonGateRulePath,
    suite: gateSuite,
    description: 'the spacing modifier is written before the ready modifier',
    find:
      "  if (ready) classes.push('vf-skeleton-gate__content--ready');\n" +
      "  if (normalizeContentSpacing) classes.push('vf-skeleton-gate__content--normalize-spacing');",
    replace:
      "  if (normalizeContentSpacing) classes.push('vf-skeleton-gate__content--normalize-spacing');\n" +
      "  if (ready) classes.push('vf-skeleton-gate__content--ready');",
  },
];

/**
 * VfProgressSpinner regressions.
 *
 * The M20 set, for the component VfButton has composed since M12. Twelve
 * declare `alsoFails: [buttonSuite]`, and the list is the M17 child-mutation
 * attribution running in both directions: the button renders the spinner, so
 * a defect in the spinner's root class, its role, its name, its artwork's
 * aria-hidden and focusable, its size property, its stroke forwarding or its
 * attribute inheritance is a defect in the button's loading state - and the button's
 * suite failing is required, not tolerated.
 *
 * The mutations *without* the declaration are as informative. The button
 * forwards a string size, so the number-to-pixels rule and the zero rule never
 * reach it; it forwards no tone, so the primary/neutral rule never reaches it;
 * it never asserts the svg's viewBox, its class, its circle count or the root
 * tag, so those stay standalone. The button's evidence depends on the spinner
 * exactly where the button exercises the spinner, and nowhere else. The
 * parity suite covers the rest of the composed markup by structure.
 */
export const progressSpinnerMutations = [
  {
    id: 'spinner-drops-the-root-class',
    // Reaches VfButton: the button asserts its spinner carries the canonical block class.
    alsoFails: [buttonSuite],
    file: progressSpinnerRulePath,
    suite: spinnerSuite,
    description: 'the block class stops reaching the root, so no stylesheet rule sizes or animates the spinner',
    find: "  const classes = ['vf-progress-spinner'];",
    replace: '  const classes = [];',
  },
  {
    id: 'spinner-becomes-a-badge-block',
    // Reaches VfButton: the button asserts the block class, and a badge block is not it.
    alsoFails: [buttonSuite],
    file: progressSpinnerRulePath,
    suite: spinnerSuite,
    description:
      "VfBadge's block name is emitted in place of the spinner's - the substitution shared tone names invite",
    find: "  const classes = ['vf-progress-spinner'];",
    replace: "  const classes = ['vf-badge'];",
  },
  {
    id: 'spinner-suppresses-neutral-instead-of-primary',
    // Not declared for VfButton: the button forwards no tone and never asserts the modifier list.
    file: progressSpinnerRulePath,
    suite: spinnerSuite,
    description: 'the tone rule is borrowed from VfBadge, so neutral emits nothing and primary emits a modifier',
    find: "  if (tone !== 'primary') classes.push(`vf-progress-spinner--${tone}`);",
    replace: "  if (tone !== 'neutral') classes.push(`vf-progress-spinner--${tone}`);",
  },
  {
    id: 'spinner-uses-the-alert-resolver',
    // Reaches VfButton: the alert's block name replaces the spinner's on the button's spinner too.
    alsoFails: [buttonSuite],
    file: progressSpinnerSourcePath,
    suite: spinnerSuite,
    description: 'the class rule is taken from VfAlert, whose suppressed tone matches and whose block name does not',
    find: "import { resolveProgressSpinnerClasses, resolveProgressSpinnerStyle } from '@codemonster-ru/vueforge-shared-core';",
    replace:
      "import { resolveAlertClasses as resolveProgressSpinnerClasses, resolveProgressSpinnerStyle } from '@codemonster-ru/vueforge-shared-core';",
  },
  {
    id: 'spinner-changes-its-default-size',
    // Not declared for VfButton: the button always forwards a size.
    file: progressSpinnerSourcePath,
    suite: spinnerSuite,
    description: 'the default size becomes a number, so the theme token stops sizing a bare spinner',
    find: '  size: undefined,',
    replace: '  size: 32,',
  },
  {
    id: 'spinner-drops-the-px-suffix',
    // Not declared for VfButton: the button forwards a string, which this rule passes through.
    file: progressSpinnerRulePath,
    suite: spinnerSuite,
    description: 'a numeric size reaches the custom property as a bare number, which is not a length',
    find: "  return typeof value === 'number' ? `${value}px` : value;",
    replace: '  return String(value);',
  },
  {
    id: 'spinner-treats-zero-as-absent',
    file: progressSpinnerRulePath,
    suite: spinnerSuite,
    description: 'size 0 is dropped as falsy instead of becoming 0px',
    find: '  if (value === null || value === undefined) {',
    replace: '  if (!value) {',
  },
  {
    id: 'spinner-drops-the-empty-declaration',
    // Not declared for VfButton: only the server output of an empty-string size moves.
    file: progressSpinnerRulePath,
    suite: spinnerSuite,
    description: "an empty size is tidied away in the rule, changing the reference's server output",
    find: '  if (length === undefined) return [];',
    replace: "  if (length === undefined || length === '') return [];",
  },
  {
    id: 'spinner-sizes-with-width-instead-of-the-custom-property',
    // Reaches VfButton: the button asserts the custom property carries its icon size token.
    alsoFails: [buttonSuite],
    file: progressSpinnerRulePath,
    suite: spinnerSuite,
    description:
      'the size is written as width and height declarations rather than the custom property the stylesheet reads',
    find: "  return [['--vf-progress-spinner-size', length]];",
    replace: "  return [\n    ['width', length],\n    ['height', length],\n  ];",
  },
  {
    id: 'spinner-changes-its-default-label',
    // Reaches VfButton: the button asserts its spinner is named exactly Loading.
    alsoFails: [buttonSuite],
    file: progressSpinnerSourcePath,
    suite: spinnerSuite,
    description: 'the default accessible name gains an ellipsis',
    find: "  label: 'Loading',",
    replace: "  label: 'Loading…',",
  },
  {
    id: 'spinner-changes-its-default-stroke-width',
    // Not declared for VfButton: the button always forwards a stroke width.
    file: progressSpinnerSourcePath,
    suite: spinnerSuite,
    description: 'the default stroke thins from 4 to 3',
    find: '  strokeWidth: 4,',
    replace: '  strokeWidth: 3,',
  },
  {
    id: 'spinner-strokes-only-the-value-arc',
    // Reaches VfButton: the button reads the stroke width off the first circle, the track.
    alsoFails: [buttonSuite],
    file: progressSpinnerSourcePath,
    suite: spinnerSuite,
    description: 'the track keeps the default stroke and only the value arc takes the prop',
    find: '<circle class="vf-progress-spinner__track" cx="25" cy="25" r="20" fill="none" :stroke-width="props.strokeWidth" />',
    replace: '<circle class="vf-progress-spinner__track" cx="25" cy="25" r="20" fill="none" stroke-width="4" />',
  },
  {
    id: 'spinner-loses-its-role',
    // Reaches VfButton: the button asserts its spinner is a progressbar.
    alsoFails: [buttonSuite],
    file: progressSpinnerSourcePath,
    suite: spinnerSuite,
    description: 'the root stops being a progressbar, so a loading state is announced by nothing',
    find: ' role="progressbar" :aria-label="props.label">',
    replace: ' :aria-label="props.label">',
  },
  {
    id: 'spinner-becomes-decorative',
    // Reaches VfButton: the button asserts its spinner is exposed and named, not hidden.
    alsoFails: [buttonSuite],
    file: progressSpinnerSourcePath,
    suite: spinnerSuite,
    description: 'the root is hidden from assistive technology instead of exposed as a named progressbar',
    find: ' role="progressbar" :aria-label="props.label">',
    replace: ' aria-hidden="true">',
  },
  {
    id: 'spinner-hides-itself-as-well-as-its-artwork',
    // Not declared for VfButton: the button never asserts the absence of aria-hidden on the root.
    file: progressSpinnerSourcePath,
    suite: spinnerSuite,
    description: 'aria-hidden is written on the root as well as on the svg, so the name is exposed to nothing',
    find: '<span :class="classes" :style="rootStyle" role="progressbar"',
    replace: '<span :class="classes" :style="rootStyle" aria-hidden="true" role="progressbar"',
  },
  {
    id: 'spinner-exposes-its-artwork',
    // Reaches VfButton: the button asserts the artwork is aria-hidden.
    alsoFails: [buttonSuite],
    file: progressSpinnerSourcePath,
    suite: spinnerSuite,
    description: 'the svg stops being aria-hidden, so the tree gains a nameless graphic beside the progressbar',
    find: ' aria-hidden="true" focusable="false">',
    replace: ' focusable="false">',
  },
  {
    id: 'spinner-artwork-becomes-focusable',
    // Reaches VfButton: the button asserts its spinner's artwork is both aria-hidden and unfocusable.
    alsoFails: [buttonSuite],
    file: progressSpinnerSourcePath,
    suite: spinnerSuite,
    description: 'focusable="false" leaves the svg, which puts the artwork in the tab order of older engines',
    find: ' aria-hidden="true" focusable="false">',
    replace: ' aria-hidden="true">',
  },
  {
    id: 'spinner-loses-the-svg-class',
    // Not declared for VfButton: the button selects the svg by tag, not by class.
    file: progressSpinnerSourcePath,
    suite: spinnerSuite,
    description: 'the svg loses the class the rotate animation is keyed on',
    find: '<svg class="vf-progress-spinner__svg" viewBox="0 0 50 50"',
    replace: '<svg viewBox="0 0 50 50"',
  },
  {
    id: 'spinner-changes-the-viewbox',
    file: progressSpinnerSourcePath,
    suite: spinnerSuite,
    description: 'the viewBox shrinks to 48 units, so the 20-unit circles no longer fit their dash lengths',
    find: 'viewBox="0 0 50 50"',
    replace: 'viewBox="0 0 48 48"',
  },
  {
    id: 'spinner-pins-the-svg-to-fifty-pixels',
    file: progressSpinnerSourcePath,
    suite: spinnerSuite,
    description: 'the svg gains width and height attributes, so the custom property stops sizing the artwork',
    find: 'viewBox="0 0 50 50"',
    replace: 'viewBox="0 0 50 50" width="50" height="50"',
  },
  {
    id: 'spinner-loses-the-track',
    // Not declared for VfButton: the button asserts nothing about the circle count.
    file: progressSpinnerSourcePath,
    suite: spinnerSuite,
    description: 'the track circle is removed, leaving the arc to spin over nothing',
    find: '      <circle class="vf-progress-spinner__track" cx="25" cy="25" r="20" fill="none" :stroke-width="props.strokeWidth" />\n',
    replace: '',
  },
  {
    id: 'spinner-shrinks-the-radius',
    file: progressSpinnerSourcePath,
    suite: spinnerSuite,
    description: 'both circles draw at radius 18, which the dash keyframes were not computed for',
    find: 'r="20"',
    replace: 'r="18"',
    all: true,
  },
  {
    id: 'spinner-renders-a-div-root',
    file: progressSpinnerSourcePath,
    suite: spinnerSuite,
    description:
      'the inline span becomes a div, which looks the same at the default display and is a different element',
    find: 'span',
    replace: 'div',
    all: true,
  },
  {
    id: 'spinner-stops-inheriting-attrs',
    // Reaches VfButton: its class, the only thing that marks the spinner as the button's, is an inherited attr.
    alsoFails: [buttonSuite],
    file: progressSpinnerSourcePath,
    suite: spinnerSuite,
    description: 'inheritAttrs is switched off, so the consumer class, style, role and data attributes vanish',
    find: "defineOptions({\n  name: 'VfProgressSpinner',\n});",
    replace: "defineOptions({\n  name: 'VfProgressSpinner',\n  inheritAttrs: false,\n});",
  },
  {
    id: 'spinner-lets-a-consumer-class-replace-its-own',
    // Reaches VfButton: the button's class replaces the block class on the button's spinner.
    alsoFails: [buttonSuite],
    file: progressSpinnerSourcePath,
    suite: spinnerSuite,
    description: 'a consumer class wins over the canonical classes instead of being appended after them',
    find: '<span :class="classes"',
    replace: '<span :class="$attrs.class ?? classes"',
  },
  {
    id: 'spinner-renders-a-slot',
    file: progressSpinnerSourcePath,
    suite: spinnerSuite,
    description: 'a default slot is rendered after the artwork, which is an API the reference does not have',
    find: '    </svg>\n  </span>',
    replace: '    </svg>\n    <slot />\n  </span>',
  },
];

/**
 * VfProgressBar regressions.
 *
 * The M21 set. No mutation declares `alsoFails`: nothing migrated composes
 * the bar, and the bar composes nothing - which is half of the independence
 * proof beside the spinner. Every mutation names `barSuite`, so a bar defect
 * credited to the spinner's evidence, or the reverse, is WRONG SUITE.
 *
 * The groups are the milestone's dimensions: the value/max arithmetic (the
 * defaults, the fallbacks, both clamps, the formula, the serialisation), the
 * ARIA (each of the three value attributes dropped on its own, the value
 * written while indeterminate, the floor moved, the role lost or downgraded),
 * the fill (the width lost, moved to the root, written as `width`, kept while
 * indeterminate), the label (always, while indeterminate, floored, made the
 * name, moved out of the fill), the classes (the spinner's resolver, the
 * spinner's block name, the badge's tone rule, animated without stripes, the
 * indeterminate modifier lost), the height, and the consumer contract.
 */
export const progressBarMutations = [
  // ---------------------------------------------------------------- defaults
  {
    id: 'bar-changes-its-default-value',
    file: progressBarSourcePath,
    suite: barSuite,
    description: 'the default value becomes 1, so a bare bar is no longer empty',
    find: '  value: 0,',
    replace: '  value: 1,',
  },
  {
    id: 'bar-changes-its-default-max',
    file: progressBarSourcePath,
    suite: barSuite,
    description: 'the default maximum becomes 200, so every default-max value is announced against the wrong range',
    find: '  max: 100,',
    replace: '  max: 200,',
  },
  {
    id: 'bar-changes-its-default-label',
    file: progressBarSourcePath,
    suite: barSuite,
    description: 'the default accessible name gains an ellipsis',
    find: "  label: 'Progress',",
    replace: "  label: 'Progress…',",
  },

  // ------------------------------------------------------------ value and max
  {
    id: 'bar-changes-the-fallback-maximum',
    file: progressBarRulePath,
    suite: barSuite,
    description: 'a non-positive or non-finite maximum falls back to 1 instead of 100',
    find: "  return typeof max === 'number' && Number.isFinite(max) && max > 0 ? max : 100;",
    replace: "  return typeof max === 'number' && Number.isFinite(max) && max > 0 ? max : 1;",
  },
  {
    id: 'bar-accepts-a-zero-maximum',
    file: progressBarRulePath,
    suite: barSuite,
    description: 'max 0 is kept rather than falling back, so the ratio divides by zero',
    find: "  return typeof max === 'number' && Number.isFinite(max) && max > 0 ? max : 100;",
    replace: "  return typeof max === 'number' && Number.isFinite(max) && max >= 0 ? max : 100;",
  },
  {
    id: 'bar-stops-clamping-the-overflow',
    file: progressBarRulePath,
    suite: barSuite,
    description: 'a value above the maximum is written through, so the width exceeds 100%',
    find: '  return Math.min(Math.max(value, 0), max);',
    replace: '  return Math.max(value, 0);',
  },
  {
    id: 'bar-stops-clamping-the-negative',
    file: progressBarRulePath,
    suite: barSuite,
    description: 'a negative value is written through, so aria-valuenow goes below the floor',
    find: '  return Math.min(Math.max(value, 0), max);',
    replace: '  return Math.min(value, max);',
  },
  {
    id: 'bar-parses-a-numeric-string',
    file: progressBarRulePath,
    suite: barSuite,
    description: 'a numeric string is coerced to its number instead of being treated as non-finite - the "obvious fix"',
    find: "  if (typeof value !== 'number' || !Number.isFinite(value)) {\n    return 0;\n  }\n\n  return Math.min(Math.max(value, 0), max);",
    replace:
      '  if (!Number.isFinite(Number(value))) {\n    return 0;\n  }\n\n  return Math.min(Math.max(Number(value), 0), max);',
  },
  {
    id: 'bar-changes-the-percentage-formula',
    file: progressBarRulePath,
    suite: barSuite,
    description: 'the width ignores the maximum, so 7 of 12 paints as 7%',
    find: '  return `${formatProgressBarNumber((value / max) * 100)}%`;',
    replace: '  return `${formatProgressBarNumber(value)}%`;',
  },
  {
    id: 'bar-rounds-the-width',
    file: progressBarRulePath,
    suite: barSuite,
    description: 'the width is rounded to a whole percent, which the reference never does',
    find: '  return `${formatProgressBarNumber((value / max) * 100)}%`;',
    replace: '  return `${formatProgressBarNumber(Math.round((value / max) * 100))}%`;',
  },
  {
    id: 'bar-rounds-the-value',
    file: progressBarRulePath,
    suite: barSuite,
    description: 'aria-valuenow is rounded while the width is not, so the announced value and the paint disagree',
    find: "  return { valuemin: '0', valuemax: formatProgressBarNumber(max), valuenow: formatProgressBarNumber(value) };",
    replace:
      "  return { valuemin: '0', valuemax: formatProgressBarNumber(max), valuenow: formatProgressBarNumber(Math.round(value)) };",
  },
  {
    id: 'bar-serialises-with-fixed-precision',
    file: progressBarRulePath,
    suite: barSuite,
    description: 'a fractional number is written with two decimals instead of the shortest round-trip digits',
    find: '  return String(value);',
    replace: '  return Number.isInteger(value) ? String(value) : value.toFixed(2);',
  },

  // -------------------------------------------------------------------- ARIA
  {
    id: 'bar-loses-its-role',
    file: progressBarSourcePath,
    suite: barSuite,
    description: 'the root stops being a progressbar, so the value is announced by nothing',
    find: '    role="progressbar"\n',
    replace: '',
  },
  {
    id: 'bar-becomes-a-status',
    file: progressBarSourcePath,
    suite: barSuite,
    description: 'the root exposes role=status instead of progressbar',
    find: '    role="progressbar"\n',
    replace: '    role="status"\n',
  },
  {
    id: 'bar-drops-aria-valuemin',
    file: progressBarSourcePath,
    suite: barSuite,
    description: 'aria-valuemin stops being written, leaving the range to the browser default',
    find: '    :aria-valuemin="valueSemantics?.valuemin"\n',
    replace: '',
  },
  {
    id: 'bar-drops-aria-valuemax',
    file: progressBarSourcePath,
    suite: barSuite,
    description: 'aria-valuemax stops being written, so a custom maximum is announced against 100',
    find: '    :aria-valuemax="valueSemantics?.valuemax"\n',
    replace: '',
  },
  {
    id: 'bar-drops-aria-valuenow',
    file: progressBarSourcePath,
    suite: barSuite,
    description:
      'aria-valuenow stops being written while the width still moves - a determinate bar that announces nothing',
    find: '    :aria-valuenow="valueSemantics?.valuenow"\n',
    replace: '',
  },
  {
    id: 'bar-always-writes-the-value-semantics',
    file: progressBarRulePath,
    suite: barSuite,
    description: 'the three value attributes are written while indeterminate too, which the reference omits',
    find: '  if (indeterminate) return null;\n\n  return { valuemin',
    replace: '  return { valuemin',
  },
  {
    id: 'bar-raises-the-floor',
    file: progressBarRulePath,
    suite: barSuite,
    description: 'aria-valuemin becomes 1',
    find: "  return { valuemin: '0', valuemax",
    replace: "  return { valuemin: '1', valuemax",
  },
  {
    id: 'bar-label-becomes-the-name',
    file: progressBarSourcePath,
    suite: barSuite,
    description: 'the visible percentage replaces the label prop as the accessible name whenever it is shown',
    find: '    :aria-label="props.label"',
    replace: '    :aria-label="props.showValue ? valueLabel : props.label"',
  },

  // ---------------------------------------------------------------- the fill
  {
    id: 'bar-fill-loses-its-width',
    file: progressBarSourcePath,
    suite: barSuite,
    description: 'the fill stops receiving its inline size, so every determinate bar paints empty',
    find: '<span class="vf-progress-bar__value" :style="valueStyle">',
    replace: '<span class="vf-progress-bar__value">',
  },
  {
    id: 'bar-writes-the-width-onto-the-root',
    file: progressBarSourcePath,
    suite: barSuite,
    description: 'the inline size is written on the root as well as the fill, so the track itself shrinks',
    find: '    :style="rootStyle"\n    role="progressbar"',
    replace: '    :style="[rootStyle, valueStyle]"\n    role="progressbar"',
  },
  {
    id: 'bar-writes-the-width-as-width',
    file: progressBarRulePath,
    suite: barSuite,
    description: 'the fill is sized with width instead of inline-size',
    find: "  return [['inline-size', percentage]];",
    replace: "  return [['width', percentage]];",
  },
  {
    id: 'bar-indeterminate-keeps-its-width',
    file: progressBarRulePath,
    suite: barSuite,
    description: 'the indeterminate fill keeps an inline size, so the stylesheet sweep runs inside a clamped box',
    find: "  if (indeterminate) return [];\n\n  return [['inline-size', percentage]];",
    replace: "  return [['inline-size', percentage]];",
  },
  {
    id: 'bar-loses-the-fill-class',
    file: progressBarSourcePath,
    suite: barSuite,
    description: 'the fill loses the class every stylesheet rule about it is keyed on',
    find: '<span class="vf-progress-bar__value" :style="valueStyle">',
    replace: '<span :style="valueStyle">',
  },

  // --------------------------------------------------------------- the label
  {
    id: 'bar-always-renders-the-label',
    file: progressBarSourcePath,
    suite: barSuite,
    description: 'the percentage label is rendered without showValue',
    find: 'v-if="props.showValue && !props.indeterminate"',
    replace: 'v-if="!props.indeterminate"',
  },
  {
    id: 'bar-renders-the-label-while-indeterminate',
    file: progressBarSourcePath,
    suite: barSuite,
    description: 'the percentage label is rendered while indeterminate, where there is no percentage',
    find: 'v-if="props.showValue && !props.indeterminate"',
    replace: 'v-if="props.showValue"',
  },
  {
    id: 'bar-floors-the-label',
    file: progressBarRulePath,
    suite: barSuite,
    description: 'the label is floored rather than rounded, so 12.5% reads 12%',
    find: '  return `${Math.round((value / max) * 100)}%`;',
    replace: '  return `${Math.floor((value / max) * 100)}%`;',
  },
  {
    id: 'bar-moves-the-label-out-of-the-fill',
    file: progressBarSourcePath,
    suite: barSuite,
    description: 'the label is rendered beside the fill rather than inside it',
    find: '    <span class="vf-progress-bar__value" :style="valueStyle">\n      <span v-if="props.showValue && !props.indeterminate" class="vf-progress-bar__label">\n        {{ valueLabel }}\n      </span>\n    </span>',
    replace:
      '    <span class="vf-progress-bar__value" :style="valueStyle"></span>\n    <span v-if="props.showValue && !props.indeterminate" class="vf-progress-bar__label">\n      {{ valueLabel }}\n    </span>',
  },

  // ------------------------------------------------------------- the classes
  {
    id: 'bar-uses-the-spinner-resolver',
    file: progressBarSourcePath,
    suite: barSuite,
    description:
      'the class rule is taken from VfProgressSpinner, which knows a tone and nothing about stripes or indeterminacy',
    find: '  resolveProgressBarClasses,\n',
    replace: '  resolveProgressSpinnerClasses as resolveProgressBarClasses,\n',
  },
  {
    id: 'bar-gains-the-spinner-class',
    file: progressBarRulePath,
    suite: barSuite,
    description: "the spinner's block class is emitted beside the bar's",
    find: "  const classes = ['vf-progress-bar'];",
    replace: "  const classes = ['vf-progress-bar', 'vf-progress-spinner'];",
  },
  {
    id: 'bar-suppresses-neutral-instead-of-primary',
    file: progressBarRulePath,
    suite: barSuite,
    description: 'the tone rule is borrowed from VfBadge, so neutral emits nothing and primary emits a modifier',
    find: "  if (tone !== 'primary') classes.push(`vf-progress-bar--${tone}`);",
    replace: "  if (tone !== 'neutral') classes.push(`vf-progress-bar--${tone}`);",
  },
  {
    id: 'bar-animates-without-stripes',
    file: progressBarRulePath,
    suite: barSuite,
    description: 'animated emits its modifier without striped',
    find: "  if (striped && animated) classes.push('vf-progress-bar--animated');",
    replace: "  if (animated) classes.push('vf-progress-bar--animated');",
  },
  {
    id: 'bar-drops-the-indeterminate-modifier',
    file: progressBarRulePath,
    suite: barSuite,
    description: 'the indeterminate modifier is never emitted, so the sweep never runs',
    find: "  if (indeterminate) classes.push('vf-progress-bar--indeterminate');\n",
    replace: '',
  },

  // -------------------------------------------------------------- the height
  {
    id: 'bar-drops-the-px-suffix',
    file: progressBarRulePath,
    suite: barSuite,
    description: 'a numeric height reaches the custom property as a bare number, which is not a length',
    find: "  return typeof value === 'number' ? `${value}px` : value;",
    replace: '  return String(value);',
  },
  {
    id: 'bar-treats-zero-height-as-absent',
    file: progressBarRulePath,
    suite: barSuite,
    description: 'height 0 is dropped as falsy instead of becoming 0px',
    find: '  if (value === null || value === undefined) {',
    replace: '  if (!value) {',
  },
  {
    id: 'bar-drops-the-empty-declaration',
    file: progressBarRulePath,
    suite: barSuite,
    description: "an empty height is tidied away in the rule, changing the reference's server output",
    find: '  if (length === undefined) return [];',
    replace: "  if (length === undefined || length === '') return [];",
  },
  {
    id: 'bar-writes-the-height-as-block-size',
    file: progressBarRulePath,
    suite: barSuite,
    description:
      'the height is written as a block-size declaration rather than the custom property the stylesheet reads',
    find: "  return [['--vf-progress-bar-height', length]];",
    replace: "  return [['block-size', length]];",
  },

  // ---------------------------------------------------------- the structure
  {
    id: 'bar-renders-a-section-root',
    file: progressBarSourcePath,
    suite: barSuite,
    description: 'the div root becomes a section, which looks identical and is a different element',
    find: 'div',
    replace: 'section',
    all: true,
  },
  {
    id: 'bar-renders-a-slot',
    file: progressBarSourcePath,
    suite: barSuite,
    description: 'a default slot is rendered after the fill, which is an API the reference does not have',
    find: '    </span>\n  </div>',
    replace: '    </span>\n    <slot />\n  </div>',
  },

  // ---------------------------------------------------------- the consumer
  {
    id: 'bar-stops-inheriting-attrs',
    file: progressBarSourcePath,
    suite: barSuite,
    description: 'inheritAttrs is switched off, so the consumer class, style, role and aria-value overrides vanish',
    find: "defineOptions({\n  name: 'VfProgressBar',\n});",
    replace: "defineOptions({\n  name: 'VfProgressBar',\n  inheritAttrs: false,\n});",
  },
  {
    id: 'bar-lets-a-consumer-class-replace-its-own',
    file: progressBarSourcePath,
    suite: barSuite,
    description: 'a consumer class wins over the canonical classes instead of being appended after them',
    find: '    :class="classes"',
    replace: '    :class="$attrs.class ?? classes"',
  },
  {
    // Three edits, because Vue offers no single place to invert the order:
    // with attrs inherited, the consumer's style is always merged after the
    // component's. The defect is the port that turned inheritance off and
    // rebound the attrs by hand with the two style sources the wrong way
    // round - the one change that lets the prop beat a consumer override.
    id: 'bar-lets-the-prop-beat-the-consumer-style',
    file: progressBarSourcePath,
    suite: barSuite,
    description:
      "the component's height declaration is merged after the consumer's, so a consumer override of the property loses",
    edits: [
      {
        find: "defineOptions({\n  name: 'VfProgressBar',\n});",
        replace: "defineOptions({\n  name: 'VfProgressBar',\n  inheritAttrs: false,\n});",
      },
      {
        find: '    :class="classes"\n    :style="rootStyle"',
        replace: '    :class="[classes, $attrs.class]"\n    :style="[$attrs.style, rootStyle]"',
      },
      {
        find: '    :aria-valuenow="valueSemantics?.valuenow"\n  >',
        replace:
          '    :aria-valuenow="valueSemantics?.valuenow"\n    v-bind="{ ...$attrs, class: undefined, style: undefined }"\n  >',
      },
    ],
  },
];

/**
 * VfAccordion regressions.
 *
 * The M22 set, and the first for a component that owns a control. The groups
 * are the milestone's dimensions: the initial state, the identity of the
 * trigger (tag, type, count), the ARIA state and the id relationships, the
 * click and keyboard activation including the keys that must *not* activate,
 * the two emits (presence, count, payload, order), the controlled-state
 * protocol, the disabled guard, DOM retention (v-if, not v-show), the icon,
 * the JavaScript transition (cleanup, delayed removal, duration, no CSS
 * classes), and the consumer-attribute contract. No mutation declares
 * `alsoFails`: the accordion composes no migrated component and nothing
 * migrated composes it.
 */
export const accordionMutations = [
  // ------------------------------------------------------------ initial state
  {
    id: 'accordion-opens-by-default',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'the default becomes open, so a bare accordion renders its panel',
    find: '  defaultOpen: false,',
    replace: '  defaultOpen: true,',
  },
  {
    id: 'accordion-ignores-the-controlled-prop',
    file: accordionSourcePath,
    suite: accordionSuite,
    description:
      'the open prop is never handed to the disclosure, so the component is uncontrolled whatever the consumer says',
    find: '  open: computed(() => props.open),',
    replace: '  open: undefined,',
  },
  {
    id: 'accordion-syncs-the-controlled-value-on-mount',
    file: disclosureComposablePath,
    suite: accordionSuite,
    description:
      'the internal state is seeded from the controlled prop at mount, so releasing control no longer reveals the seeded default',
    find: '        internalOpen.value = value;\n      }\n    },\n  );',
    replace: '        internalOpen.value = value;\n      }\n    },\n    { immediate: true },\n  );',
  },

  // -------------------------------------------------------- trigger identity
  {
    id: 'accordion-trigger-becomes-a-div',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'the native button is replaced by a div with role=button and tabindex=0',
    edits: [
      {
        find: '    <button\n      :id="triggerId"',
        replace: '    <div\n      role="button"\n      tabindex="0"\n      :id="triggerId"',
      },
      { find: '      </span>\n    </button>', replace: '      </span>\n    </div>' },
    ],
  },
  {
    id: 'accordion-trigger-becomes-a-submit-button',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'the trigger submits a surrounding form',
    find: '      type="button"',
    replace: '      type="submit"',
  },
  {
    id: 'accordion-renders-a-second-trigger',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'a second component-owned button appears beside the trigger',
    find: '    <Transition\n',
    replace:
      '    <button type="button" class="vf-accordion__trigger" @click="toggle">{{ title }}</button>\n    <Transition\n',
  },
  {
    id: 'accordion-trigger-listens-on-the-root',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'the click handler moves from the trigger to the section, so a click anywhere in the panel toggles',
    edits: [
      { find: '  <section class="vf-accordion">', replace: '  <section class="vf-accordion" @click="toggle">' },
      { find: '      @click="toggle"\n', replace: '' },
    ],
  },

  // ---------------------------------------------------------- ARIA and ids
  {
    id: 'accordion-inverts-aria-expanded',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'aria-expanded announces the opposite of the state while the DOM is right',
    find: '      :aria-expanded="isOpen"',
    replace: '      :aria-expanded="!isOpen"',
  },
  {
    id: 'accordion-aria-controls-points-at-the-trigger',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'aria-controls names the trigger itself rather than the panel',
    find: '      :aria-controls="contentId"',
    replace: '      :aria-controls="triggerId"',
  },
  {
    id: 'accordion-panel-loses-its-id',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'the panel has no id, so aria-controls resolves to nothing even when open',
    find: '      <div v-if="isOpen" :id="contentId" :aria-labelledby',
    replace: '      <div v-if="isOpen" :aria-labelledby',
  },
  {
    id: 'accordion-panel-is-labelled-by-itself',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'aria-labelledby points at the panel instead of the trigger',
    find: ':aria-labelledby="triggerId"',
    replace: ':aria-labelledby="contentId"',
  },
  {
    id: 'accordion-region-becomes-a-group',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'the panel loses its landmark role',
    find: 'class="vf-accordion__content" role="region"',
    replace: 'class="vf-accordion__content" role="group"',
  },
  {
    id: 'accordion-changes-its-id-prefix',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'the generated trigger id changes its prefix',
    find: "useId({ prefix: 'vf-accordion-trigger' })",
    replace: "useId({ prefix: 'vf-accordion-header' })",
  },
  {
    id: 'accordion-shares-one-id-between-trigger-and-panel',
    file: accordionSourcePath,
    suite: accordionSuite,
    description:
      'the panel reuses the trigger id, so aria-controls resolves to the trigger and two elements share an id',
    find: "const contentId = useId({ prefix: 'vf-accordion-content' });",
    replace: 'const contentId = triggerId;',
  },

  // -------------------------------------------------------------- activation
  {
    id: 'accordion-disabled-still-toggles',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'the disabled guard is removed from toggle',
    find: '  if (!props.disabled) {\n    disclosure.toggle();\n  }',
    replace: '  disclosure.toggle();',
  },
  {
    id: 'accordion-click-stops-toggling',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'the click listener is gone; only the keyboard toggles',
    find: '      @click="toggle"\n',
    replace: '',
  },
  {
    id: 'accordion-enter-stops-toggling',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'Enter is no longer an activation key',
    find: "  if (event.key === 'Enter' || event.key === ' ') {",
    replace: "  if (event.key === ' ') {",
  },
  {
    id: 'accordion-space-stops-toggling',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'Space is no longer an activation key',
    find: "  if (event.key === 'Enter' || event.key === ' ') {",
    replace: "  if (event.key === 'Enter') {",
  },
  {
    id: 'accordion-adds-arrow-key-activation',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'ArrowDown toggles too - a WAI-ARIA "improvement" the reference never had',
    find: "  if (event.key === 'Enter' || event.key === ' ') {",
    replace: "  if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {",
  },
  {
    id: 'accordion-keyboard-stops-preventing-default',
    file: accordionSourcePath,
    suite: accordionSuite,
    description:
      'keydown no longer prevents the default, so a native click would follow the handler toggle in a browser',
    find: '    event.preventDefault();\n    toggle();',
    replace: '    toggle();',
  },

  // ------------------------------------------------------------------ events
  {
    id: 'accordion-drops-open-change',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'openChange is never emitted',
    find: "    emit('openChange', value);\n",
    replace: '',
  },
  {
    id: 'accordion-doubles-update-open',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'update:open is emitted twice per toggle',
    find: "    emit('update:open', value);",
    replace: "    emit('update:open', value);\n    emit('update:open', value);",
  },
  {
    id: 'accordion-emits-the-previous-value',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'both events carry the state being left rather than the state being entered',
    find: "    emit('update:open', value);\n    emit('openChange', value);",
    replace: "    emit('update:open', !value);\n    emit('openChange', !value);",
  },
  {
    id: 'accordion-swaps-the-event-order',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'openChange fires before update:open',
    find: "    emit('update:open', value);\n    emit('openChange', value);",
    replace: "    emit('openChange', value);\n    emit('update:open', value);",
  },

  // ------------------------------------------------------- retention & icon
  {
    id: 'accordion-retains-the-panel-with-v-show',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'the panel stays mounted and hidden instead of being destroyed',
    find: '      <div v-if="isOpen" :id="contentId"',
    replace: '      <div v-show="isOpen" :id="contentId"',
  },
  {
    id: 'accordion-drops-the-inner-wrapper',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'the slot renders straight into the region without the inner div the transition measures',
    find: '        <div class="vf-accordion__content-inner">\n          <slot :open="isOpen" />\n        </div>',
    replace: '        <slot :open="isOpen" />',
  },
  {
    id: 'accordion-icon-loses-its-open-modifier',
    file: accordionRulePath,
    suite: accordionSuite,
    description: 'the shared icon rule never adds the open modifier, so the chevron never rotates',
    find: "  if (open) classes.push('vf-accordion__icon--open');",
    replace: '',
  },
  {
    id: 'accordion-icon-modifier-lands-on-the-wrong-element',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'the open modifier is written on the trigger instead of the icon wrapper',
    edits: [
      {
        find: '      <span aria-hidden="true" :class="iconClasses">',
        replace: '      <span aria-hidden="true" class="vf-accordion__icon">',
      },
      {
        find: '      class="vf-accordion__trigger"\n      type="button"',
        replace:
          '      :class="[\'vf-accordion__trigger\', isOpen && \'vf-accordion__icon--open\']"\n      type="button"',
      },
    ],
  },
  {
    id: 'accordion-transition-drops-the-opacity-fade',
    file: accordionRulePath,
    suite: accordionSuite,
    description: 'the shared transition declaration animates height only',
    find: "    'opacity var(--vf-motion-duration-normal) var(--vf-motion-ease-standard)',\n",
    replace: '',
  },
  {
    id: 'accordion-swaps-the-glyph',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'the trigger renders chevron-up',
    find: 'icons.chevronDown',
    replace: 'icons.chevronUp',
  },
  {
    id: 'accordion-drops-the-empty-title-span',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'the title span is rendered only for a non-empty title',
    find: '        <span>{{ title }}</span>',
    replace: '        <span v-if="title">{{ title }}</span>',
  },

  // -------------------------------------------------------------- transition
  {
    id: 'accordion-skips-the-enter-cleanup',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'the inline height, opacity, overflow and transition survive the enter',
    find: 'function onAfterEnter(el: Element) {\n  const target = el as HTMLElement;',
    replace: 'function onAfterEnter(el: Element) {\n  if (el) return;\n  const target = el as HTMLElement;',
  },
  {
    id: 'accordion-removes-the-panel-immediately',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'leave completes at once, so the panel is torn out without its collapse',
    find: "  target.style.opacity = '0';\n\n  window.setTimeout(done, vfMotionDurationsMs.normal);",
    replace: "  target.style.opacity = '0';\n\n  done();",
  },
  {
    id: 'accordion-animates-with-the-fast-duration',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'both hooks wait the fast duration rather than the normal one',
    find: 'vfMotionDurationsMs.normal',
    replace: 'vfMotionDurationsMs.fast',
    all: true,
  },
  {
    id: 'accordion-uses-css-transition-classes',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'the transition applies enter/leave classes as well as the JavaScript hooks',
    find: '      :css="false"',
    replace: '      :css="true"',
  },

  // ------------------------------------------------------- consumer attrs
  {
    id: 'accordion-moves-consumer-attrs-onto-the-trigger',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'attribute inheritance is turned off and the attrs are rebound onto the button',
    edits: [
      {
        find: 'interface VfAccordionProps {',
        replace: 'defineOptions({ inheritAttrs: false });\n\ninterface VfAccordionProps {',
      },
      {
        find: '      class="vf-accordion__trigger"\n      type="button"',
        replace: '      class="vf-accordion__trigger"\n      type="button"\n      v-bind="$attrs"',
      },
    ],
  },
  {
    id: 'accordion-lets-a-consumer-class-replace-its-own',
    file: accordionSourcePath,
    suite: accordionSuite,
    description: 'a consumer class wins over the canonical root class instead of being appended after it',
    edits: [
      {
        find: 'interface VfAccordionProps {',
        replace: 'defineOptions({ inheritAttrs: false });\n\ninterface VfAccordionProps {',
      },
      {
        find: '  <section class="vf-accordion">',
        replace: '  <section :class="$attrs.class ?? \'vf-accordion\'" v-bind="{ ...$attrs, class: undefined }">',
      },
    ],
  },
];

/**
 * VfStepper. The second component that owns controls, and a mutation set that
 * has to prove a different set of things from the accordion's: selection on
 * a string with a fallback, per-item state precedence, the progress factor's
 * arithmetic and serialisation, native Enter/Space beside handled Arrow, Home
 * and End, focus that moves between the owned buttons - document-wide, which
 * is the historical quirk pinned as such - and the deep items watch.
 */
export const stepperMutations = [
  // ------------------------------------------------------------ state model
  {
    id: 'stepper-falls-back-to-the-first-item',
    file: stepperRulePath,
    suite: stepperSuite,
    description: 'the fallback is the first item rather than the first enabled item',
    find: '  return items.find((item) => !item.disabled)?.value;',
    replace: '  return items[0]?.value;',
  },
  {
    id: 'stepper-treats-null-as-uncontrolled',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'controlled means "not nullish", so a null modelValue writes the internal state on click',
    find: 'const isControlled = computed(() => props.modelValue !== undefined);',
    replace: 'const isControlled = computed(() => props.modelValue != null);',
  },
  {
    id: 'stepper-ignores-default-value',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'defaultValue no longer seeds the internal state',
    find: 'const internalValue = ref(props.defaultValue ?? fallbackValue.value);',
    replace: 'const internalValue = ref(fallbackValue.value);',
  },
  {
    id: 'stepper-normalises-empty-model-value',
    file: stepperRulePath,
    suite: stepperSuite,
    description: 'an empty-string modelValue falls through to the internal state',
    find: '  return modelValue ?? internalValue ?? resolveStepperFallbackValue(items);',
    replace: '  return modelValue || internalValue || resolveStepperFallbackValue(items);',
  },

  // -------------------------------------------------------------- step state
  {
    id: 'stepper-current-beats-disabled',
    file: stepperRulePath,
    suite: stepperSuite,
    description: 'a disabled active item is reported current rather than disabled',
    find: "  if (item.disabled) {\n    return 'disabled';\n  }\n\n  const activeIndex = resolveStepperActiveIndex",
    replace: '  const activeIndex = resolveStepperActiveIndex',
  },
  {
    id: 'stepper-complete-after-current',
    file: stepperRulePath,
    suite: stepperSuite,
    description: 'the steps after the current one are complete and the ones before it upcoming',
    find: '  if (activeIndex >= 0 && currentIndex < activeIndex) {',
    replace: '  if (activeIndex >= 0 && currentIndex > activeIndex) {',
  },
  {
    id: 'stepper-unknown-value-marks-first-current',
    file: stepperRulePath,
    suite: stepperSuite,
    description: 'an unknown active value falls back to the first step for the state, though not for the value',
    find: '  const activeIndex = resolveStepperActiveIndex(items, activeValue);\n  const currentIndex',
    replace: '  const activeIndex = Math.max(0, resolveStepperActiveIndex(items, activeValue));\n  const currentIndex',
  },
  {
    id: 'stepper-aria-current-true',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'aria-current is written as "true" instead of "step"',
    find: ":aria-current=\"stepState(item) === 'current' ? 'step' : undefined\"",
    replace: ":aria-current=\"stepState(item) === 'current' ? 'true' : undefined\"",
  },
  {
    id: 'stepper-aria-current-on-every-trigger',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'aria-current="false" is written on the non-current triggers',
    find: ":aria-current=\"stepState(item) === 'current' ? 'step' : undefined\"",
    replace: ":aria-current=\"stepState(item) === 'current' ? 'step' : 'false'\"",
  },
  {
    id: 'stepper-trigger-current-class-dropped',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'the trigger loses its own current modifier; only the item carries state',
    find: ":class=\"stepState(item) === 'current' && 'vf-stepper__trigger--current'\"",
    replace: '',
  },
  {
    id: 'stepper-disabled-becomes-aria-disabled',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'the native disabled attribute is replaced by aria-disabled',
    find: '          :disabled="item.disabled"',
    replace: '          :aria-disabled="item.disabled ? \'true\' : undefined"',
  },

  // -------------------------------------------------------------- root style
  {
    id: 'stepper-counts-enabled-items',
    file: stepperRulePath,
    suite: stepperSuite,
    description: 'the item count custom property counts enabled items only',
    find: '  const count = items.length;',
    replace: '  const count = items.filter((item) => !item.disabled).length;',
  },
  {
    id: 'stepper-factor-over-count',
    file: stepperRulePath,
    suite: stepperSuite,
    description: 'the progress factor divides by the count instead of the count minus one',
    find: 'formatStepperProgressFactor(normalizedActiveIndex / (count - 1))',
    replace: 'formatStepperProgressFactor(normalizedActiveIndex / count)',
  },
  {
    id: 'stepper-factor-rounded',
    file: stepperRulePath,
    suite: stepperSuite,
    description: 'the progress factor is rounded to two decimals, so 1/3 is written as 0.33',
    find: '  return String(factor);',
    replace: '  return String(Math.round(factor * 100) / 100);',
  },
  {
    id: 'stepper-factor-fourteen-digits',
    file: stepperRulePath,
    suite: stepperSuite,
    description: "the progress factor is written with PHP's default fourteen significant digits: 0.33333333333333",
    find: '  return String(factor);',
    replace: '  return String(Number(factor.toPrecision(14)));',
  },
  {
    id: 'stepper-factor-for-one-item',
    file: stepperRulePath,
    suite: stepperSuite,
    description: 'a single item writes a progress factor as well',
    find: '  if (count <= 1) {',
    replace: '  if (count < 1) {',
  },
  {
    id: 'stepper-unknown-value-negative-factor',
    file: stepperRulePath,
    suite: stepperSuite,
    description: 'an unknown active value is not normalised, so the factor goes negative',
    find: '  const normalizedActiveIndex = activeIndex < 0 ? 0 : activeIndex;',
    replace: '  const normalizedActiveIndex = activeIndex;',
  },

  // ------------------------------------------------------------------ events
  {
    id: 'stepper-emits-change-first',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'change is emitted before update:modelValue',
    find: "  emit('update:modelValue', value);\n  emit('change', value);",
    replace: "  emit('change', value);\n  emit('update:modelValue', value);",
  },
  {
    id: 'stepper-skips-update-model-value',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'only change is emitted',
    find: "  emit('update:modelValue', value);\n  emit('change', value);",
    replace: "  emit('change', value);",
  },
  {
    id: 'stepper-current-reclick-emits',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'clicking the current step emits the pair again',
    find: '  if (!item.disabled && item.value !== activeValue.value) {',
    replace: '  if (!item.disabled) {',
  },
  {
    id: 'stepper-disabled-activates',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'the disabled guard is gone from activation',
    find: '  if (!item.disabled && item.value !== activeValue.value) {',
    replace: '  if (item.value !== activeValue.value) {',
  },
  {
    id: 'stepper-writes-internal-state-when-controlled',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'the internal state is written even in controlled mode',
    find: '  if (!isControlled.value) {\n    internalValue.value = value;\n  }',
    replace: '  internalValue.value = value;',
  },
  {
    id: 'stepper-emits-the-index',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'the events carry the item index instead of its value',
    find: '    setActiveValue(item.value);\n  }\n}',
    replace: "    setActiveValue(item.value);\n    emit('change', String(props.items.indexOf(item)));\n  }\n}",
  },

  // ---------------------------------------------------- native Enter / Space
  {
    id: 'stepper-handles-enter-manually',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'Enter is handled on keydown with preventDefault and manual activation instead of native activation',
    find: "  const nextKey = props.orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';",
    replace:
      "  if (event.key === 'Enter') {\n    event.preventDefault();\n    activateStep(currentItem);\n    return;\n  }\n\n" +
      "  const nextKey = props.orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';",
  },
  {
    id: 'stepper-handles-space-manually',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'Space is handled on keydown with preventDefault and manual activation instead of native activation',
    find: "  const nextKey = props.orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';",
    replace:
      "  if (event.key === ' ') {\n    event.preventDefault();\n    activateStep(currentItem);\n    return;\n  }\n\n" +
      "  const nextKey = props.orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';",
  },

  // ------------------------------------------------------------- navigation
  {
    id: 'stepper-horizontal-keys-swapped',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'horizontal navigation listens to ArrowDown/ArrowUp',
    find:
      "  const nextKey = props.orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';\n" +
      "  const previousKey = props.orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';",
    replace:
      "  const nextKey = props.orientation === 'vertical' ? 'ArrowDown' : 'ArrowDown';\n" +
      "  const previousKey = props.orientation === 'vertical' ? 'ArrowUp' : 'ArrowUp';",
  },
  {
    id: 'stepper-vertical-keys-swapped',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'vertical navigation listens to ArrowRight/ArrowLeft',
    find:
      "  const nextKey = props.orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';\n" +
      "  const previousKey = props.orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';",
    replace:
      "  const nextKey = props.orientation === 'vertical' ? 'ArrowRight' : 'ArrowRight';\n" +
      "  const previousKey = props.orientation === 'vertical' ? 'ArrowLeft' : 'ArrowLeft';",
  },
  {
    id: 'stepper-handles-both-axes',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'the wrong axis is handled as well: ArrowDown navigates a horizontal stepper',
    find: '  if (event.key === nextKey) {',
    replace: "  if (event.key === nextKey || event.key === 'ArrowDown' || event.key === 'ArrowRight') {",
  },
  {
    id: 'stepper-arrow-without-prevent-default',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'the next-arrow branch no longer prevents the default',
    find: '  if (event.key === nextKey) {\n    event.preventDefault();',
    replace: '  if (event.key === nextKey) {',
  },
  {
    id: 'stepper-arrow-does-not-wrap',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'ArrowRight on the last enabled step stays on it instead of wrapping',
    find: '    const nextItem = enabledItems[(currentIndex + 1) % enabledItems.length];',
    replace: '    const nextItem = enabledItems[Math.min(currentIndex + 1, enabledItems.length - 1)];',
  },
  {
    id: 'stepper-arrow-does-not-skip-disabled',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'navigation walks every item, disabled ones included',
    find: '  return props.items.filter((item) => !item.disabled);',
    replace: '  return props.items;',
  },
  {
    id: 'stepper-home-goes-to-second',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'Home lands on the second enabled step',
    find: '    const firstItem = enabledItems[0];',
    replace: '    const firstItem = enabledItems[1] ?? enabledItems[0];',
  },
  {
    id: 'stepper-end-goes-to-first',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'End lands on the first enabled step',
    find: '    const lastItem = enabledItems[enabledItems.length - 1];',
    replace: '    const lastItem = enabledItems[0];',
  },
  {
    id: 'stepper-arrow-does-not-move-focus',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'ArrowRight activates the next step without focusing it',
    find: '    activateStep(nextItem);\n    focusStepByValue(nextItem.value);',
    replace: '    activateStep(nextItem);',
  },
  {
    id: 'stepper-home-focuses-without-activating',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'Home moves focus but does not activate',
    find: '    activateStep(firstItem);\n    focusStepByValue(firstItem.value);',
    replace: '    focusStepByValue(firstItem.value);',
  },
  {
    id: 'stepper-navigates-relative-to-the-active-step',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'navigation starts from the active step rather than from the focused trigger',
    find: '  const currentIndex = enabledItems.findIndex((item) => item.value === currentItem.value);',
    replace: '  const currentIndex = enabledItems.findIndex((item) => item.value === activeValue.value);',
  },
  {
    id: 'stepper-focuses-within-the-instance',
    file: stepperSourcePath,
    suite: stepperSuite,
    description:
      'focusStepByValue is scoped to the instance root, so two steppers sharing values no longer cross - the ' +
      'historical document-wide quirk, corrected, which the characterization must refuse',
    edits: [
      {
        find: "import { computed, ref, useAttrs, watch, type CSSProperties } from 'vue';",
        replace: "import { computed, ref, useAttrs, useTemplateRef, watch, type CSSProperties } from 'vue';",
      },
      {
        find: 'function focusStepByValue(value: string) {\n  const element = document.querySelector<HTMLElement>(',
        replace:
          "const rootElement = useTemplateRef<HTMLElement>('root');\n\n" +
          'function focusStepByValue(value: string) {\n  const element = rootElement.value?.querySelector<HTMLElement>(',
      },
      {
        find: '  <nav :class="rootClasses"',
        replace: '  <nav ref="root" :class="rootClasses"',
      },
    ],
  },

  // -------------------------------------------------------------- items watch
  {
    id: 'stepper-watch-removed',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'the items watch is gone, so a disabled or removed active item keeps the stale value',
    find: '    if (!hasActiveItem && fallbackValue.value) {\n      setActiveValue(fallbackValue.value);\n    }',
    replace: '    void hasActiveItem;',
  },
  {
    id: 'stepper-watch-immediate',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'the items watch runs at mount, so a disabled defaultValue is reseeded and emitted at once',
    find: '  { deep: true },\n);',
    replace: '  { deep: true, immediate: true },\n);',
  },
  {
    id: 'stepper-watch-reseeds-silently',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'the watch writes the fallback without emitting',
    find: '    if (!hasActiveItem && fallbackValue.value) {\n      setActiveValue(fallbackValue.value);\n    }',
    replace:
      '    if (!hasActiveItem && fallbackValue.value) {\n      internalValue.value = fallbackValue.value;\n    }',
  },

  // ---------------------------------------------------------------- markup
  {
    id: 'stepper-trigger-becomes-a-div',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'the native button is replaced by a div with role=button and tabindex=0',
    edits: [
      {
        find: '        <button\n          type="button"\n          class="vf-stepper__trigger"',
        replace: '        <div\n          role="button"\n          tabindex="0"\n          class="vf-stepper__trigger"',
      },
      { find: '          </span>\n        </button>', replace: '          </span>\n        </div>' },
    ],
  },
  {
    id: 'stepper-trigger-becomes-a-submit-button',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'the trigger submits a surrounding form',
    find: '        <button\n          type="button"',
    replace: '        <button\n          type="submit"',
  },
  {
    id: 'stepper-description-for-empty-string',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'an empty description renders its span',
    find: '<span v-if="item.description" class="vf-stepper__description">',
    replace: '<span v-if="item.description !== undefined" class="vf-stepper__description">',
  },
  {
    id: 'stepper-marker-from-zero',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'the marker numbers from zero',
    find: '            {{ index + 1 }}',
    replace: '            {{ index }}',
  },
  {
    id: 'stepper-vertical-content-above',
    file: stepperRulePath,
    suite: stepperSuite,
    description: 'a vertical stepper accepts the horizontal content positions',
    find: "    return contentPosition === 'start' ? 'start' : 'end';",
    replace: "    return contentPosition ?? 'end';",
  },
  {
    id: 'stepper-list-is-unordered',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'the ordered list becomes an unordered one',
    edits: [
      { find: '    <ol class="vf-stepper__list">', replace: '    <ul class="vf-stepper__list">' },
      { find: '    </ol>', replace: '    </ul>' },
    ],
  },
  {
    id: 'stepper-root-is-a-div',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'the nav becomes a div',
    edits: [
      { find: '  <nav :class="rootClasses"', replace: '  <div :class="rootClasses"' },
      { find: '  </nav>', replace: '  </div>' },
    ],
  },

  // ------------------------------------------------------------------ attrs
  {
    id: 'stepper-consumer-class-first',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'a consumer class is written before the canonical classes',
    find: '  cx(...resolveStepperClasses(props.orientation, props.contentPosition), attrs.class as string | undefined),',
    replace:
      '  cx(attrs.class as string | undefined, ...resolveStepperClasses(props.orientation, props.contentPosition)),',
  },
  {
    id: 'stepper-ignores-the-shared-state-rule',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'the component stops consulting the shared step-state rule and reports every step upcoming',
    find: '  return resolveStepperStepState(props.items, activeValue.value, item);',
    replace: "  return item.disabled ? 'disabled' : 'upcoming';",
  },
  {
    id: 'stepper-attrs-land-on-the-triggers',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'forwarded attributes are written onto every trigger as well as the root',
    find: '          :disabled="item.disabled"',
    replace: '          :disabled="item.disabled"\n          v-bind="rootAttrs"',
  },
  {
    id: 'stepper-aria-label-default-dropped',
    file: stepperSourcePath,
    suite: stepperSuite,
    description: 'the nav has no accessible name by default',
    find: "  ariaLabel: 'Progress',",
    replace: '  ariaLabel: undefined,',
  },
];

export const tabsMutations = [
  // ------------------------------------------------------------ state model
  {
    id: 'tabs-falls-back-to-the-first-item',
    file: tabsRulePath,
    suite: tabsSuite,
    description: 'the fallback is the first item rather than the first enabled item',
    find: '  return items.find((item) => !item.disabled)?.value;',
    replace: '  return items[0]?.value;',
  },
  {
    id: 'tabs-treats-null-as-uncontrolled',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'controlled means "not nullish", so a null modelValue writes the internal state on click',
    find: 'const isControlled = computed(() => props.modelValue !== undefined);',
    replace: 'const isControlled = computed(() => props.modelValue != null);',
  },
  {
    id: 'tabs-ignores-default-value',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'defaultValue no longer seeds the internal state',
    find: 'const internalValue = ref(props.defaultValue ?? fallbackValue.value);',
    replace: 'const internalValue = ref(fallbackValue.value);',
  },
  {
    id: 'tabs-rejects-a-disabled-default-value',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'a defaultValue naming a disabled item is replaced by the fallback at mount',
    find: 'const internalValue = ref(props.defaultValue ?? fallbackValue.value);',
    replace:
      'const internalValue = ref(props.items.find((item) => item.value === props.defaultValue && !item.disabled)?.value ?? fallbackValue.value);',
  },
  {
    id: 'tabs-normalises-empty-model-value',
    file: tabsRulePath,
    suite: tabsSuite,
    description: 'an empty-string modelValue falls through to the internal state',
    find: '  return modelValue ?? internalValue ?? resolveTabsFallbackValue(items);',
    replace: '  return modelValue || internalValue || resolveTabsFallbackValue(items);',
  },
  {
    id: 'tabs-unknown-value-falls-back',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'an unknown controlled value selects the first enabled item instead of nothing',
    find: 'const activeItem = computed(() => props.items[resolveTabsActiveIndex(props.items, activeValue.value)]);',
    replace:
      'const activeItem = computed(\n  () => props.items[resolveTabsActiveIndex(props.items, activeValue.value)] ?? props.items.find((item) => !item.disabled),\n);',
  },
  {
    id: 'tabs-writes-state-when-controlled',
    file: tabsSourcePath,
    suite: tabsSuite,
    description:
      'a controlled tabs writes the clicked value into its internal state, so a refusing parent is overridden',
    find: '  if (!isControlled.value) {\n    internalValue.value = value;\n  }',
    replace: '  internalValue.value = value;',
  },

  // ----------------------------------------------------------------- events
  {
    id: 'tabs-current-activation-emits-nothing',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'activating the current tab is suppressed instead of emitting the pair again',
    find: '  if (!item.disabled) {\n    setActiveValue(item.value);\n  }',
    replace: '  if (!item.disabled && item.value !== activeValue.value) {\n    setActiveValue(item.value);\n  }',
  },
  {
    id: 'tabs-event-order-reversed',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'change is emitted before update:modelValue',
    find: "  emit('update:modelValue', value);\n  emit('change', value);",
    replace: "  emit('change', value);\n  emit('update:modelValue', value);",
  },
  {
    id: 'tabs-emits-change-twice',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'change is emitted twice per activation',
    find: "  emit('update:modelValue', value);\n  emit('change', value);",
    replace: "  emit('update:modelValue', value);\n  emit('change', value);\n  emit('change', value);",
  },
  {
    id: 'tabs-omits-update-model-value',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'only change is emitted, so v-model consumers never hear the activation',
    find: "  emit('update:modelValue', value);\n  emit('change', value);",
    replace: "  emit('change', value);",
  },

  // ------------------------------------------------------- selection markup
  {
    id: 'tabs-aria-selected-absent-when-false',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'aria-selected is written only on the selected tab instead of "false" on every other',
    find: '          :aria-selected="isTabsItemSelected(activeValue, item)"',
    replace: `          :aria-selected="isTabsItemSelected(activeValue, item) ? 'true' : undefined"`,
  },
  {
    id: 'tabs-tabindex-inverted',
    file: tabsRulePath,
    suite: tabsSuite,
    description: 'the selected tab gets tabindex=-1 and every other tabindex=0',
    find: '  return isTabsItemSelected(activeValue, item) ? 0 : -1;',
    replace: '  return isTabsItemSelected(activeValue, item) ? -1 : 0;',
  },
  {
    id: 'tabs-tabindex-all-zero',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'every tab is in the tab order',
    find: '          :tabindex="resolveTabsTabIndex(activeValue, item)"',
    replace: '          tabindex="0"',
  },
  {
    id: 'tabs-tabindex-first-always',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'the first tab is always the tabbable one whatever the selection',
    find: '          :tabindex="resolveTabsTabIndex(activeValue, item)"',
    replace: '          :tabindex="index === 0 ? 0 : -1"',
  },
  {
    id: 'tabs-selection-normalised-to-first-duplicate',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'only the first tab of a duplicated value is selected and tabbable',
    find: '          :aria-selected="isTabsItemSelected(activeValue, item)"',
    replace:
      '          :aria-selected="isTabsItemSelected(activeValue, item) && props.items.findIndex((entry) => entry.value === item.value) === index"',
  },
  {
    id: 'tabs-role-removed',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'the tab buttons carry no role',
    find: '          role="tab"\n',
    replace: '',
  },
  {
    id: 'tabs-tablist-vertical',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'the tablist announces a vertical orientation',
    find: '<div role="tablist" aria-orientation="horizontal">',
    replace: '<div role="tablist" aria-orientation="vertical">',
  },
  {
    id: 'tabs-type-submit',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'the tab buttons are type=submit',
    find: '          class="vf-tabs__tab"\n          role="tab"\n          type="button"',
    replace: '          class="vf-tabs__tab"\n          role="tab"\n          type="submit"',
  },
  {
    id: 'tabs-aria-disabled-instead-of-native',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'a disabled item writes aria-disabled instead of the native attribute',
    find: '          :disabled="item.disabled"\n',
    replace: '          :aria-disabled="item.disabled"\n',
  },

  // -------------------------------------------------------------------- ids
  {
    id: 'tabs-ignores-tab-id',
    file: tabsRulePath,
    suite: tabsSuite,
    description: 'the tabId override is ignored',
    find: '  return item.tabId ?? `${baseId}-tab-${item.value}`;',
    replace: '  return `${baseId}-tab-${item.value}`;',
  },
  {
    id: 'tabs-ignores-panel-id',
    file: tabsRulePath,
    suite: tabsSuite,
    description: 'the panelId override is ignored',
    find: '  return item.panelId ?? `${baseId}-panel-${item.value}`;',
    replace: '  return `${baseId}-panel-${item.value}`;',
  },
  {
    id: 'tabs-sanitises-the-id-value',
    file: tabsRulePath,
    suite: tabsSuite,
    description: 'spaces in a value are replaced in the generated ids',
    find: '  return item.tabId ?? `${baseId}-tab-${item.value}`;',
    replace: "  return item.tabId ?? `${baseId}-tab-${item.value.replace(/\\s+/g, '-')}`;",
  },
  {
    id: 'tabs-dedupes-duplicate-ids',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'duplicate values get index-suffixed ids instead of colliding',
    find: '  return resolveTabsTabId(baseId.value, item);',
    replace: '  return `${resolveTabsTabId(baseId.value, item)}-${props.items.indexOf(item)}`;',
  },
  {
    id: 'tabs-controls-written-without-a-panel',
    file: tabsRulePath,
    suite: tabsSuite,
    description: 'aria-controls is written on every tab even when no panel slot and no panelId exists',
    find: '  if (!hasPanelSlot && !item.panelId) {\n    return undefined;\n  }\n\n  return resolveTabsPanelId(baseId, item);',
    replace: '  return resolveTabsPanelId(baseId, item);',
  },
  {
    id: 'tabs-controls-ignore-external-panel-id',
    file: tabsRulePath,
    suite: tabsSuite,
    description: 'a panelId item without a panel slot loses its aria-controls',
    find: '  if (!hasPanelSlot && !item.panelId) {',
    replace: '  if (!hasPanelSlot) {',
  },
  {
    id: 'tabs-panel-labelled-by-its-own-id',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'the panel names its own id in aria-labelledby instead of the active tab',
    find: '      :aria-labelledby="tabId(activeItem)"',
    replace: '      :aria-labelledby="panelId(activeItem)"',
  },

  // ------------------------------------------------------------------ panel
  {
    id: 'tabs-panel-without-slot',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'an empty panel is rendered even when no panel slot exists',
    find: '      v-if="activeItem && slots.panel"',
    replace: '      v-if="activeItem"',
  },
  {
    id: 'tabs-panel-not-tabbable',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'the panel has tabindex=-1',
    find: '      role="tabpanel"\n      tabindex="0"',
    replace: '      role="tabpanel"\n      tabindex="-1"',
  },
  {
    id: 'tabs-panel-is-a-region',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'the panel is a region rather than a tabpanel',
    find: '      role="tabpanel"\n      tabindex="0"',
    replace: '      role="region"\n      tabindex="0"',
  },
  {
    id: 'tabs-panel-slot-gets-the-label',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'the panel slot receives the label as activeValue',
    find: '<slot name="panel" v-bind="{ activeValue: activeItem.value }" />',
    replace: '<slot name="panel" v-bind="{ activeValue: activeItem.label }" />',
  },
  {
    id: 'tabs-tab-slot-loses-is-active',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'the tab slot always receives isActive=false',
    find: '<slot name="tab" v-bind="{ item, isActive: isTabsItemSelected(activeValue, item), index }">',
    replace: '<slot name="tab" v-bind="{ item, isActive: false, index }">',
  },

  // --------------------------------------------------------------- keyboard
  {
    id: 'tabs-arrow-down-ignored',
    file: tabsRulePath,
    suite: tabsSuite,
    description: 'ArrowDown no longer moves forward on the horizontal tablist',
    find: "  const movesForward = key === 'ArrowDown' || (isRtl ? key === 'ArrowLeft' : key === 'ArrowRight');",
    replace: "  const movesForward = isRtl ? key === 'ArrowLeft' : key === 'ArrowRight';",
  },
  {
    id: 'tabs-arrow-up-ignored',
    file: tabsRulePath,
    suite: tabsSuite,
    description: 'ArrowUp no longer moves backward',
    find: "  const movesBackward = key === 'ArrowUp' || (isRtl ? key === 'ArrowRight' : key === 'ArrowLeft');",
    replace: "  const movesBackward = isRtl ? key === 'ArrowRight' : key === 'ArrowLeft';",
  },
  {
    id: 'tabs-forward-key-not-prevented',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'a forward navigation key moves the selection but is not prevented',
    find: '  event.preventDefault();\n  activateTab(nextItem as VfTabItem);',
    replace: '  activateTab(nextItem as VfTabItem);',
  },
  {
    id: 'tabs-no-wrap-forward',
    file: tabsRulePath,
    suite: tabsSuite,
    description: 'forward navigation stops at the last enabled tab',
    find: '    return enabledItems[(currentIndex + 1) % enabledItems.length];',
    replace: '    return enabledItems[Math.min(currentIndex + 1, enabledItems.length - 1)];',
  },
  {
    id: 'tabs-no-wrap-backward',
    file: tabsRulePath,
    suite: tabsSuite,
    description: 'backward navigation stops at the first enabled tab',
    find: '    return enabledItems[(currentIndex - 1 + enabledItems.length) % enabledItems.length];',
    replace: '    return enabledItems[Math.max(currentIndex - 1, 0)];',
  },
  {
    id: 'tabs-disabled-not-skipped',
    file: tabsRulePath,
    suite: tabsSuite,
    description: 'navigation walks every item, disabled ones included',
    find: '  const enabledItems = items.filter((item) => !item.disabled);',
    replace: '  const enabledItems = [...items];',
  },
  {
    id: 'tabs-home-goes-to-second',
    file: tabsRulePath,
    suite: tabsSuite,
    description: 'Home lands on the second enabled tab',
    find: "  if (key === 'Home') {\n    return enabledItems[0];",
    replace: "  if (key === 'Home') {\n    return enabledItems[1] ?? enabledItems[0];",
  },
  {
    id: 'tabs-end-goes-to-penultimate',
    file: tabsRulePath,
    suite: tabsSuite,
    description: 'End lands on the penultimate enabled tab',
    find: "  if (key === 'End') {\n    return enabledItems[enabledItems.length - 1];",
    replace: "  if (key === 'End') {\n    return enabledItems[enabledItems.length - 2] ?? enabledItems[0];",
  },
  {
    id: 'tabs-enter-handled',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'Enter is handled on keydown with preventDefault instead of being left to the browser',
    find: '  const nextItem = resolveTabsNavigationTarget(',
    replace:
      "  if (event.key === 'Enter') {\n    event.preventDefault();\n    activateTab(currentItem);\n    return;\n  }\n  const nextItem = resolveTabsNavigationTarget(",
  },
  {
    id: 'tabs-space-handled',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'Space is handled on keydown with preventDefault instead of being left to the browser',
    find: '  const nextItem = resolveTabsNavigationTarget(',
    replace:
      "  if (event.key === ' ') {\n    event.preventDefault();\n    activateTab(currentItem);\n    return;\n  }\n  const nextItem = resolveTabsNavigationTarget(",
  },
  {
    id: 'tabs-navigation-starts-from-the-selected-tab',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'navigation starts from the selected tab rather than the tab that received the key',
    find: 'resolveTabsNavigationTarget(props.items, currentItem.value, event.key, isRtl)',
    replace: "resolveTabsNavigationTarget(props.items, activeValue.value ?? '', event.key, isRtl)",
  },
  {
    id: 'tabs-forward-moves-selection-not-focus',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'a forward key activates the next tab but leaves focus where it was',
    find: '  activateTab(nextItem as VfTabItem);\n  focusTabByValue(nextItem.value);',
    replace: '  activateTab(nextItem as VfTabItem);',
  },
  {
    id: 'tabs-forward-moves-focus-not-selection',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'a forward key focuses the next tab but does not activate it',
    find: '  activateTab(nextItem as VfTabItem);\n  focusTabByValue(nextItem.value);',
    replace: '  focusTabByValue(nextItem.value);',
  },
  {
    id: 'tabs-rtl-not-reversed',
    file: tabsRulePath,
    suite: tabsSuite,
    description: 'ArrowLeft and ArrowRight keep their LTR meaning under RTL',
    find: "  const movesForward = key === 'ArrowDown' || (isRtl ? key === 'ArrowLeft' : key === 'ArrowRight');",
    replace: "  const movesForward = key === 'ArrowDown' || key === 'ArrowRight';",
  },
  {
    id: 'tabs-keyboard-reads-computed-direction',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'the keyboard direction also honours the computed style, which the reference never reads',
    find: "    (!directionHost && document.documentElement.getAttribute('dir')?.toLowerCase() === 'rtl');",
    replace:
      "    (!directionHost && document.documentElement.getAttribute('dir')?.toLowerCase() === 'rtl') ||\n    (target !== null && getComputedStyle(target).direction === 'rtl');",
  },
  {
    id: 'tabs-keyboard-ignores-document-direction',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'the document element dir is no longer the fallback when no ancestor declares one',
    find: "    (!directionHost && document.documentElement.getAttribute('dir')?.toLowerCase() === 'rtl');",
    replace: '    false;',
  },
  {
    id: 'tabs-focus-is-document-wide',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'focus is moved through a document-wide lookup, so a sibling sharing values receives it',
    find: '  tabRefs.value[index]?.focus();',
    replace: "  document.querySelectorAll<HTMLElement>('.vf-tabs__tab')[index]?.focus();",
  },
  {
    id: 'tabs-disabled-tab-navigates',
    file: tabsRulePath,
    suite: tabsSuite,
    description: 'a key on a disabled tab navigates from the start of the enabled ring instead of being ignored',
    find: '  if (currentIndex === -1) {\n    return undefined;\n  }\n\n  const movesForward',
    replace: '  const movesForward',
  },
  {
    id: 'tabs-duplicate-focus-lands-on-the-last',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'focus by value lands on the last matching tab instead of the first',
    find: '  const index = props.items.findIndex((item) => item.value === value);\n  tabRefs.value[index]?.focus();',
    replace:
      '  const index = props.items.findLastIndex((item) => item.value === value);\n  tabRefs.value[index]?.focus();',
  },

  // ------------------------------------------------------------ items watch
  {
    id: 'tabs-watch-is-immediate',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'the items watch runs at mount, so a disabled defaultValue is reseeded at once',
    find: '  { deep: true },\n);\n\nfunction setActiveValue',
    replace: '  { deep: true, immediate: true },\n);\n\nfunction setActiveValue',
  },
  {
    id: 'tabs-watch-keeps-a-disabled-active-item',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'disabling the active item no longer reseeds the fallback',
    find: '    const hasActiveItem = items.some((item) => item.value === activeValue.value && !item.disabled);',
    replace: '    const hasActiveItem = items.some((item) => item.value === activeValue.value);',
  },
  {
    id: 'tabs-watch-reseeds-silently',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'the watch writes the fallback without emitting the pair',
    find: '    if (!hasActiveItem && fallbackValue.value) {\n      setActiveValue(fallbackValue.value);\n    }',
    replace:
      '    if (!hasActiveItem && fallbackValue.value) {\n      internalValue.value = fallbackValue.value;\n    }',
  },

  // -------------------------------------------------------------- indicator
  {
    id: 'tabs-indicator-x-rounded',
    file: tabsRulePath,
    suite: tabsSuite,
    description: 'the indicator offset is rounded to whole pixels',
    find: "    ['transform', `translateX(${visibleStart}px)`],",
    replace: "    ['transform', `translateX(${Math.round(visibleStart)}px)`],",
  },
  {
    id: 'tabs-indicator-width-rounded',
    file: tabsRulePath,
    suite: tabsSuite,
    description: 'the indicator width is rounded to whole pixels',
    find: "    ['width', `${visibleWidth}px`],",
    replace: "    ['width', `${Math.round(visibleWidth)}px`],",
  },
  {
    id: 'tabs-indicator-x-ignores-the-list',
    file: tabsRulePath,
    suite: tabsSuite,
    description: "the indicator offset is the tab's page position rather than its offset inside the list",
    find: '  const tabStart = measurement.tabLeft - measurement.listLeft;',
    replace: '  const tabStart = measurement.tabLeft;',
  },
  {
    id: 'tabs-indicator-ignores-the-left-inset',
    file: tabsRulePath,
    suite: tabsSuite,
    description: 'the indicator is not clipped by the shown left scroll button',
    find: '  const visibleStart = Math.max(measurement.insetStart, tabStart);',
    replace: '  const visibleStart = tabStart;',
  },
  {
    id: 'tabs-indicator-ignores-the-right-inset',
    file: tabsRulePath,
    suite: tabsSuite,
    description: 'the indicator is not clipped by the shown right scroll button',
    find: '  const visibleEnd = Math.min(measurement.listClientWidth - measurement.insetEnd, tabEnd);',
    replace: '  const visibleEnd = Math.min(measurement.listClientWidth, tabEnd);',
  },
  {
    id: 'tabs-clipped-indicator-stays-visible',
    file: tabsRulePath,
    suite: tabsSuite,
    description: 'an active tab scrolled out of view keeps a visible indicator',
    find: "    ['opacity', isVisible ? '1' : '0'],",
    replace: "    ['opacity', '1'],",
  },
  {
    id: 'tabs-indicator-seed-in-pixels',
    file: tabsRulePath,
    suite: tabsSuite,
    description: 'the no-active-tab indicator writes translateX(0px) instead of the literal translateX(0)',
    find: "  ['transform', 'translateX(0)'],",
    replace: "  ['transform', 'translateX(0px)'],",
  },
  {
    id: 'tabs-indicator-ready-at-mount',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'the indicator transitions from the first paint instead of after the first frame',
    find: '  requestAnimationFrame(() => {\n    indicatorReady.value = true;\n  });',
    replace: '  indicatorReady.value = true;',
  },
  {
    id: 'tabs-no-resize-observer',
    file: tabsSourcePath,
    suite: tabsSuite,
    description: 'the tabs stop observing the viewport for size changes',
    find: "  if (typeof ResizeObserver !== 'undefined' && listRef.value) {\n    listResizeObserver = new ResizeObserver(() => {\n      updateIndicator();\n      updateScrollState();\n    });\n    listResizeObserver.observe(listRef.value);\n  }",
    replace: '',
  },

  // --------------------------------------------------------------- scroller
  {
    id: 'scroller-threshold-zero',
    file: tabsRulePath,
    suite: tabsSuite,
    description: 'a single remaining pixel already counts as scrollable',
    find: '    canScrollLeft: measurement.isRtl ? maxScrollLeft - scrollOffset > 1 : scrollOffset > 1,\n    canScrollRight: measurement.isRtl ? scrollOffset > 1 : maxScrollLeft - scrollOffset > 1,',
    replace:
      '    canScrollLeft: measurement.isRtl ? maxScrollLeft - scrollOffset > 0 : scrollOffset > 0,\n    canScrollRight: measurement.isRtl ? scrollOffset > 0 : maxScrollLeft - scrollOffset > 0,',
  },
  {
    id: 'scroller-rtl-reads-raw-scroll-left',
    file: tabsRulePath,
    suite: tabsSuite,
    description: 'the RTL scroll offset is the raw negative scrollLeft',
    find: '  const scrollOffset = measurement.isRtl ? Math.abs(Math.min(measurement.scrollLeft, 0)) : measurement.scrollLeft;',
    replace: '  const scrollOffset = measurement.scrollLeft;',
  },
  {
    id: 'scroller-ignores-computed-direction',
    file: horizontalScrollerSourcePath,
    suite: tabsSuite,
    description: 'the scroller reads only the dir attribute, never the computed direction',
    find: "    directionHost?.getAttribute('dir')?.toLowerCase() === 'rtl' ||\n    window.getComputedStyle(viewport).direction === 'rtl';",
    replace: "    directionHost?.getAttribute('dir')?.toLowerCase() === 'rtl';",
  },
  {
    id: 'scroller-step-without-minimum',
    file: tabsRulePath,
    suite: tabsSuite,
    description: 'the scroll step is 60% of the viewport with no 120px minimum',
    find: '  return Math.max(minStep, Math.round(clientWidth * stepRatio));',
    replace: '  return Math.round(clientWidth * stepRatio);',
  },
  {
    id: 'scroller-ignores-reduced-motion',
    file: horizontalScrollerSourcePath,
    suite: tabsSuite,
    description: 'the scroll is always smooth, reduced motion or not',
    find: "    behavior:\n      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches\n        ? 'auto'\n        : 'smooth',",
    replace: "    behavior: 'smooth',",
  },
  {
    id: 'scroller-timer-shortened',
    file: horizontalScrollerSourcePath,
    suite: tabsSuite,
    description: 'the scrolling state ends after 40 ms instead of 140',
    find: '  }, 140);',
    replace: '  }, 40);',
  },
  {
    id: 'scroller-timer-not-restarted',
    file: horizontalScrollerSourcePath,
    suite: tabsSuite,
    description: 'a scroll during the scrolling state no longer restarts the timer',
    find: '  if (scrollStopTimeout) {\n    clearTimeout(scrollStopTimeout);\n  }\n  scrollStopTimeout = setTimeout',
    replace: '  scrollStopTimeout = setTimeout',
  },
  {
    id: 'scroller-scrollbar-never-thin',
    file: horizontalScrollerSourcePath,
    suite: tabsSuite,
    description: 'the viewport scrollbar-width variable stays none while scrolling',
    find: "      '--vf-horizontal-scroller-scrollbar-width': isScrolling.value ? 'thin' : 'none',",
    replace: "      '--vf-horizontal-scroller-scrollbar-width': 'none',",
  },
  {
    id: 'scroller-fade-before-animated',
    file: horizontalScrollerSourcePath,
    suite: tabsSuite,
    description: 'the right fade renders as soon as the list can scroll, before the animated frame',
    find: '      v-if="controlsAnimated && canScrollRight"',
    replace: '      v-if="canScrollRight"',
  },
  {
    id: 'scroller-hidden-control-tabbable',
    file: horizontalScrollerSourcePath,
    suite: tabsSuite,
    description: 'a hidden scroll control keeps tabindex=0',
    find: '      :tabindex="controlsReady && canScrollRight ? 0 : -1"',
    replace: '      tabindex="0"',
  },
  {
    id: 'scroller-hidden-control-not-aria-hidden',
    file: horizontalScrollerSourcePath,
    suite: tabsSuite,
    description: 'a hidden scroll control is not aria-hidden',
    find: '      :aria-hidden="!controlsReady || !canScrollRight"',
    replace: '      aria-hidden="false"',
  },
  {
    id: 'scroller-hidden-control-enabled',
    file: horizontalScrollerSourcePath,
    suite: tabsSuite,
    description: 'a hidden scroll control is not disabled',
    find: '      :disabled="!controlsReady || !canScrollLeft"',
    replace: '',
  },
  {
    id: 'scroller-controls-ready-at-mount',
    file: horizontalScrollerSourcePath,
    suite: tabsSuite,
    description: 'the controls are ready and animated at mount instead of one and two frames later',
    find: '  requestAnimationFrame(() => {\n    controlsReady.value = true;\n    updateScrollState();\n    emitState();\n    requestAnimationFrame(() => {\n      controlsAnimated.value = true;\n      emitState();\n    });\n  });',
    replace: '  controlsReady.value = true;\n  controlsAnimated.value = true;\n  updateScrollState();\n  emitState();',
  },
  {
    id: 'scroller-no-resize-observer',
    file: horizontalScrollerSourcePath,
    suite: tabsSuite,
    description: 'the scroller stops observing its viewport',
    find: "  if (typeof ResizeObserver !== 'undefined' && viewportRef.value) {\n    resizeObserver = new ResizeObserver(() => {\n      updateScrollState();\n    });\n    resizeObserver.observe(viewportRef.value);\n  }",
    replace: '',
  },
  {
    id: 'scroller-no-teardown',
    file: horizontalScrollerSourcePath,
    suite: tabsSuite,
    description: 'the resize listener and the observer survive unmount',
    find: "  resizeObserver?.disconnect();\n  if (scrollStopTimeout) {\n    clearTimeout(scrollStopTimeout);\n  }\n\n  if (typeof window !== 'undefined') {\n    window.removeEventListener('resize', handleWindowResize);\n  }",
    replace: '',
  },
  {
    id: 'scroller-left-label-dropped',
    file: horizontalScrollerSourcePath,
    suite: tabsSuite,
    description: 'the left control loses its accessible name',
    find: '      :aria-label="leftAriaLabel"',
    replace: '',
  },
];

/**
 * VfLink regressions.
 *
 * The M25 set. The reference link has two branches and one derivation, and
 * the mutations that carry this milestone are the ones a migration would call
 * improvements or would make while "simplifying" the branch selection:
 *
 *   - `link-root-becomes-a-span` and `link-router-branch-made-native` change
 *     what element renders. The second is the tempting one: with no router
 *     registered, an `<a>` looks more useful than the literal unresolved
 *     element the reference renders - and it is a different contract;
 *   - `link-native-branch-routed` and `link-routes-without-to` select the
 *     router branch when the reference selects the anchor;
 *   - `link-href-survives-to` and `link-href-forwarded-to-router` keep an
 *     href the reference discards, `link-to-serialised` and
 *     `link-object-to-altered` touch a destination the reference passes
 *     through untouched, and `link-attrs-dropped-from-handoff` loses what
 *     the router component is owed;
 *   - the rel mutations, on the shared rule: derived for `_self`, never
 *     derived, merged with an explicit value, or overriding one;
 *   - `link-consumer-class-first` and the two modifier typos, on the class
 *     merge and the shared class rule.
 *
 * Every one fails VfLink's own suite and none touches another component.
 */
export const linkMutations = [
  {
    id: 'link-root-becomes-a-span',
    file: linkSourcePath,
    suite: linkSuite,
    description: 'the native branch renders a span instead of an anchor, which looks the same and is not a link',
    find: "  if (!isRouterLink.value) {\n    return 'a';\n  }",
    replace: "  if (!isRouterLink.value) {\n    return 'span';\n  }",
  },
  {
    id: 'link-router-branch-made-native',
    file: linkSourcePath,
    suite: linkSuite,
    description: 'the router branch falls back to a native anchor instead of resolving RouterLink',
    find: "  return props.component ?? resolveDynamicComponent('RouterLink');",
    replace: "  return props.component ?? 'a';",
  },
  {
    id: 'link-native-branch-routed',
    file: linkSourcePath,
    suite: linkSuite,
    description: 'the native branch is routed through RouterLink whenever one is registered',
    find: "  if (!isRouterLink.value) {\n    return 'a';\n  }\n\n  return props.component ?? resolveDynamicComponent('RouterLink');",
    replace:
      "  const resolved = resolveDynamicComponent('RouterLink');\n" +
      "  if (!isRouterLink.value && typeof resolved === 'string') {\n    return 'a';\n  }\n\n  return props.component ?? resolved;",
  },
  {
    id: 'link-routes-without-to',
    file: linkSourcePath,
    suite: linkSuite,
    description: 'the router branch is selected on href being absent rather than on to being present',
    find: 'const isRouterLink = computed(() => props.to !== undefined);',
    replace: 'const isRouterLink = computed(() => props.href === undefined);',
  },
  {
    id: 'link-href-survives-to',
    file: linkSourcePath,
    suite: linkSuite,
    description: 'href is kept beside to instead of being discarded',
    find: '    return {\n      to: props.to,\n      target: props.target,\n      rel: resolvedRel.value,\n    };',
    replace:
      '    return {\n      to: props.to,\n      href: props.href,\n      target: props.target,\n      rel: resolvedRel.value,\n    };',
  },
  {
    id: 'link-href-forwarded-to-router',
    file: linkSourcePath,
    suite: linkSuite,
    description: 'the router component is handed an href derived from a string destination',
    find: '    return {\n      to: props.to,\n      target: props.target,\n      rel: resolvedRel.value,\n    };',
    replace:
      "    return {\n      to: props.to,\n      href: typeof props.to === 'string' ? props.to : undefined,\n      target: props.target,\n      rel: resolvedRel.value,\n    };",
  },
  {
    id: 'link-to-serialised',
    file: linkSourcePath,
    suite: linkSuite,
    description: 'an object destination is JSON-encoded before the handoff instead of passed through untouched',
    find: '    return {\n      to: props.to,\n      target: props.target,\n      rel: resolvedRel.value,\n    };',
    replace:
      "    return {\n      to: typeof props.to === 'string' ? props.to : JSON.stringify(props.to),\n      target: props.target,\n      rel: resolvedRel.value,\n    };",
  },
  {
    id: 'link-object-to-altered',
    file: linkSourcePath,
    suite: linkSuite,
    description: 'an object destination is copied and given a default before the handoff',
    find: '    return {\n      to: props.to,\n      target: props.target,\n      rel: resolvedRel.value,\n    };',
    replace:
      "    return {\n      to: typeof props.to === 'string' ? props.to : { replace: false, ...props.to },\n      target: props.target,\n      rel: resolvedRel.value,\n    };",
  },
  {
    id: 'link-attrs-dropped-from-handoff',
    file: linkSourcePath,
    suite: linkSuite,
    description: 'consumer attrs stop reaching the rendered element',
    find: 'const componentProps = computed(() => ({\n  ...attrs,\n  ...linkProps.value,',
    replace: 'const componentProps = computed(() => ({\n  ...linkProps.value,',
  },
  {
    id: 'link-consumer-class-first',
    file: linkSourcePath,
    suite: linkSuite,
    description: 'the consumer class is merged before the canonical classes',
    find: '  class: [classes.value, externalClass.value],',
    replace: '  class: [externalClass.value, classes.value],',
  },
  {
    id: 'link-rel-derived-for-self',
    file: linkRulePath,
    suite: linkSuite,
    description: 'rel is derived for _self as well as for _blank',
    find: "  return target === '_blank' ? 'noopener noreferrer' : undefined;",
    replace: "  return target === '_blank' || target === '_self' ? 'noopener noreferrer' : undefined;",
  },
  {
    id: 'link-rel-never-derived',
    file: linkRulePath,
    suite: linkSuite,
    description: 'the derived rel is dropped, so a _blank link opens without noopener',
    find: "  return target === '_blank' ? 'noopener noreferrer' : undefined;",
    replace: '  return undefined;',
  },
  {
    id: 'link-rel-appended-to-explicit',
    file: linkRulePath,
    suite: linkSuite,
    description: 'the derived rel is appended to an explicit one instead of the explicit one winning',
    find: "  if (rel) return rel;\n\n  return target === '_blank' ? 'noopener noreferrer' : undefined;",
    replace:
      "  const derived = target === '_blank' ? 'noopener noreferrer' : undefined;\n" +
      '  if (rel) return derived ? `${rel} ${derived}` : rel;\n\n  return derived;',
  },
  {
    id: 'link-rel-explicit-overridden',
    file: linkRulePath,
    suite: linkSuite,
    description: 'the derived rel overrides an explicit one for _blank',
    find: "  if (rel) return rel;\n\n  return target === '_blank' ? 'noopener noreferrer' : undefined;",
    replace: "  if (target === '_blank') return 'noopener noreferrer';\n\n  return rel || undefined;",
  },
  {
    id: 'link-empty-rel-wins',
    file: linkRulePath,
    suite: linkSuite,
    description: 'an empty-string rel is treated as given, so a _blank link loses the derivation',
    find: '  if (rel) return rel;',
    replace: '  if (rel !== undefined && rel !== null) return rel || undefined;',
  },
  {
    id: 'link-underline-modifier-typo',
    file: linkRulePath,
    suite: linkSuite,
    description: 'the always modifier is misspelled, which no stylesheet rule matches',
    find: "  if (underline === 'always') classes.push('vf-link--underline-always');",
    replace: "  if (underline === 'always') classes.push('vf-link--underlined');",
  },
  {
    id: 'link-tone-modifier-before-underline',
    file: linkRulePath,
    suite: linkSuite,
    description: 'the tone modifier is emitted before the underline modifier',
    find:
      "  if (underline === 'hover') classes.push('vf-link--underline-hover');\n" +
      "  if (underline === 'always') classes.push('vf-link--underline-always');\n" +
      "  if (tone === 'muted') classes.push('vf-link--muted');",
    replace:
      "  if (tone === 'muted') classes.push('vf-link--muted');\n" +
      "  if (underline === 'hover') classes.push('vf-link--underline-hover');\n" +
      "  if (underline === 'always') classes.push('vf-link--underline-always');",
  },
  {
    id: 'link-no-destination-gets-a-role',
    file: linkSourcePath,
    suite: linkSuite,
    description: 'an anchor with no destination is given role=link and a tabindex to make it "accessible"',
    find: '  return {\n    href: props.href,\n    target: props.target,\n    rel: resolvedRel.value,\n  };',
    replace:
      "  return {\n    href: props.href,\n    role: props.href === undefined ? 'link' : undefined,\n" +
      "    tabindex: props.href === undefined ? '0' : undefined,\n    target: props.target,\n    rel: resolvedRel.value,\n  };",
  },
];

export const componentMutations = [
  ...inputMutations,
  ...iconButtonMutations,
  ...fieldMutations,
  ...buttonMutations,
  ...textareaMutations,
  ...checkboxMutations,
  ...radioMutations,
  ...switchMutations,
  ...badgeMutations,
  ...tagMutations,
  ...dividerMutations,
  ...skeletonMutations,
  ...avatarMutations,
  ...cardMutations,
  ...skeletonGateMutations,
  ...panelMutations,
  ...alertMutations,
  ...progressSpinnerMutations,
  ...progressBarMutations,
  ...accordionMutations,
  ...stepperMutations,
  ...tabsMutations,
  ...linkMutations,
];
