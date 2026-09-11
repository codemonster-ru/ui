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
export const buttonMutations = [
  {
    id: 'button-submits-by-default',
    file: buttonSourcePath,
    description: 'the default type becomes submit, so a button inside a form posts it',
    find: "  type: 'button',",
    replace: "  type: 'submit',",
  },
  {
    id: 'button-drops-the-variant-modifier',
    file: buttonRulePath,
    description: 'the variant modifier disappears, so every button renders as the base style',
    find: "  const classes = ['vf-button', `vf-button--${variant}`];",
    replace: "  const classes = ['vf-button'];",
  },
  {
    id: 'button-emits-a-default-size-modifier',
    file: buttonRulePath,
    description: 'the medium size starts emitting a modifier the stylesheet never defined',
    find: "  if (size !== 'md') classes.push(`vf-button--${size}`);",
    replace: '  classes.push(`vf-button--${size}`);',
  },
  {
    id: 'button-drops-the-block-modifier',
    file: buttonRulePath,
    description: 'a block button stops filling its container',
    find: "  if (block) classes.push('vf-button--block');",
    replace: '',
  },
  {
    id: 'button-drops-the-loading-modifier',
    file: buttonRulePath,
    description: 'a loading button stops looking like one',
    find: "  if (loading) classes.push('vf-button--loading');",
    replace: '',
  },
  {
    id: 'button-loading-stops-disabling',
    file: buttonRulePath,
    description: 'a loading button becomes operable again, which no snapshot would show',
    find: '  return loading || disabled;',
    replace: '  return disabled;',
  },
  {
    id: 'button-ignores-the-disabled-attribute',
    file: buttonSourcePath,
    description: 'a disabled button becomes operable',
    find: ' :disabled="isDisabled"',
    replace: '',
  },
  {
    id: 'button-drops-attribute-forwarding',
    file: buttonSourcePath,
    description: 'inherited attrs stop reaching the button, losing aria-label, name and consumer class',
    find: 'v-bind="attrs" ',
    replace: '',
  },
  {
    id: 'button-drops-its-slot',
    file: buttonSourcePath,
    description: 'the button renders empty, so it has no label at all',
    find: '    <slot />\n',
    replace: '',
  },
  {
    id: 'button-renders-the-spinner-after-its-label',
    file: buttonSourcePath,
    description: 'the loading spinner moves to the far side of the label',
    find: '    <VfProgressSpinner\n      v-if="props.loading"\n      class="vf-button__spinner"\n      size="var(--vf-icon-current-size)"\n      :stroke-width="5"\n    />\n    <slot />',
    replace:
      '    <slot />\n    <VfProgressSpinner\n      v-if="props.loading"\n      class="vf-button__spinner"\n      size="var(--vf-icon-current-size)"\n      :stroke-width="5"\n    />',
  },
  {
    id: 'button-drops-aria-busy',
    file: buttonRulePath,
    description: 'a loading button stops announcing itself busy',
    find: "  return loading ? 'true' : undefined;",
    replace: '  return undefined;',
  },
  {
    id: 'button-hides-the-spinner-from-assistive-tech',
    file: buttonSourcePath,
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
    replace: '    <slot />\n\n    <footer v-if="$slots.footer">\n      <slot name="footer" />\n    </footer>\n  </section>',
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
    find:
      '      <slot name="header">\n        <h3 class="vf-panel__title">{{ props.title }}</h3>\n      </slot>',
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
    description: 'the always-empty content style binding is tidied away, changing every gate\'s server output',
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
    replace: "<VfSkeleton :min-height=\"minHeight\" :radius=\"radius || 'var(--vf-radius-surface)'\" />",
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
    description: 'the reserve precedence becomes a truthiness check, so zero stops reserving and empty starts falling through',
    find: '  if (reserve !== undefined) {',
    replace: '  if (reserve) {',
  },
  {
    id: 'gate-reserve-is-checked-before-conversion',
    file: skeletonGateRulePath,
    suite: gateSuite,
    description: 'the reserve is checked before the length conversion, so a zero reserve is read as a number rather than a length',
    find: '  const reserve = resolveSkeletonGateLength(reserveHeight);\n  if (reserve !== undefined) {',
    replace: '  const reserve = reserveHeight === null || reserveHeight === undefined ? undefined : resolveSkeletonGateLength(reserveHeight);\n  if (reserve !== undefined && reserve !== \'\') {',
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
    replace: "  if (fadeDuration !== 220) declarations.push(['--vf-skeleton-gate-fade-duration', `${fadeDuration}ms`]);",
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
];
