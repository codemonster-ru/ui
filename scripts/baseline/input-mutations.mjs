// The negative fixture for M01.
//
// A large characterization suite proves nothing on its own: it has to fail when
// the component regresses. Each mutation below reproduces a regression the first
// migration actually shipped (architecture plan, section 6). The mutation is
// applied in memory by a Vite plugin, so VfInput.vue on disk is never modified.
export const inputSourcePath = 'packages/core/src/components/input/VfInput.vue';

export const inputMutations = [
  {
    id: 'drop-leading-icon',
    description: 'leadingIcon prop no longer renders an adornment (main dropped leadingIcon entirely)',
    find: 'const hasLeadingAdornment = computed(() => Boolean(props.leadingIcon) || Boolean(slots.leading));',
    replace: 'const hasLeadingAdornment = computed(() => Boolean(slots.leading));',
  },
  {
    id: 'drop-trailing-icon',
    description: 'trailingIcon prop no longer renders an adornment (main dropped trailingIcon entirely)',
    find: 'const hasTrailingAdornment = computed(() => Boolean(props.trailingIcon) || Boolean(slots.trailing));',
    replace: 'const hasTrailingAdornment = computed(() => Boolean(slots.trailing));',
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
    find: '  () => Boolean(props.clearable) && hasValue.value && !isDisabled.value && !isReadonly.value,',
    replace: '  () => Boolean(props.clearable) && hasValue.value && !isDisabled.value,',
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
  {
    id: 'floating-always-on',
    description: 'floating state stops depending on the field label placement',
    find: "const isFloatingLabel = computed(() => fieldContext?.labelPlacement.value === 'floating');",
    replace: 'const isFloatingLabel = computed(() => Boolean(fieldContext));',
  },
];
