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

export const componentMutations = [
  ...inputMutations,
  ...iconButtonMutations,
  ...fieldMutations,
  ...buttonMutations,
  ...textareaMutations,
  ...checkboxMutations,
  ...radioMutations,
  ...switchMutations,
];
