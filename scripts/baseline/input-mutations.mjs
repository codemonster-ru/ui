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

export const componentMutations = [...inputMutations, ...iconButtonMutations, ...fieldMutations];
