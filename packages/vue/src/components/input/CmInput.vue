<script setup lang="ts">
import { computed, nextTick, ref, useAttrs, useSlots, watch, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import type { CmInputSize, CmInputType } from './input.types';

defineOptions({ inheritAttrs: false });

const types: readonly CmInputType[] = ['text', 'email', 'password', 'search', 'tel', 'url'];
const sizes: readonly CmInputSize[] = ['sm', 'md', 'lg'];
const props = defineProps({
  modelValue: { type: String, default: '' },
  type: {
    type: String as PropType<CmInputType>,
    default: 'text',
    validator: (value: string) => ['text', 'email', 'password', 'search', 'tel', 'url'].includes(value),
  },
  size: {
    type: String as PropType<CmInputSize>,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg'].includes(value),
  },
  invalid: Boolean,
  disabled: Boolean,
  readonly: Boolean,
  required: Boolean,
  clearable: Boolean,
  passwordReveal: Boolean,
  clearLabel: { type: String, default: 'Clear input' },
  showPasswordLabel: { type: String, default: 'Show password' },
  hidePasswordLabel: { type: String, default: 'Hide password' },
});
const emit = defineEmits<{
  input: [event: Event];
  'update:modelValue': [value: string];
}>();
const attrs = useAttrs();
const slots = useSlots();
const inputRef = ref<HTMLInputElement | null>(null);
const currentValue = ref(props.modelValue);
const passwordVisible = ref(false);
watch(
  () => props.modelValue,
  (value) => {
    currentValue.value = value;
  },
);
const inputType = computed(() => (types.includes(props.type) ? props.type : 'text'));
const resolvedInputType = computed(() =>
  props.passwordReveal && inputType.value === 'password' && passwordVisible.value ? 'text' : inputType.value,
);
const size = computed(() => (sizes.includes(props.size) ? props.size : 'md'));
const hasLeading = computed(() => Boolean(slots.leading));
const hasTrailing = computed(() => Boolean(slots.trailing));
const hasPasswordReveal = computed(() => props.passwordReveal && inputType.value === 'password');
const hasClear = computed(() => props.clearable && !props.disabled && !props.readonly);
const hasWrapper = computed(() => hasLeading.value || hasTrailing.value || hasPasswordReveal.value || hasClear.value);
const classes = computed(() =>
  mergeCmClasses(
    'cm-input',
    `cm-input--${size.value}`,
    props.invalid ? 'cm-input--invalid' : undefined,
    attrs.class as CmClassValue,
  ),
);
const rootAttrs = computed(() =>
  omitCmOwnedAttrs(attrs, ['value', 'type', 'disabled', 'readonly', 'required', 'aria-invalid', 'onInput']),
);

function updateValue(event: Event): void {
  currentValue.value = (event.target as HTMLInputElement).value;
  emit('update:modelValue', currentValue.value);
  emit('input', event);
}

function clearValue(): void {
  const input = inputRef.value;
  if (!input) return;
  input.value = '';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.focus();
}

async function togglePassword(): Promise<void> {
  const input = inputRef.value;
  const selection = input?.selectionStart === null ? null : [input?.selectionStart ?? 0, input?.selectionEnd ?? 0];
  passwordVisible.value = !passwordVisible.value;
  await nextTick();
  inputRef.value?.focus();
  if (selection) inputRef.value?.setSelectionRange(selection[0], selection[1]);
}
</script>

<template>
  <div
    v-if="hasWrapper"
    class="cm-input-wrap"
    :data-cm-controller="hasPasswordReveal || hasClear ? 'input' : undefined"
  >
    <span v-if="hasLeading" class="cm-input__leading"><slot name="leading" /></span>
    <input
      ref="inputRef"
      v-bind="rootAttrs"
      :class="classes"
      :type="resolvedInputType"
      :value="currentValue"
      :disabled="props.disabled || undefined"
      :readonly="props.readonly || undefined"
      :required="props.required || undefined"
      :aria-invalid="props.invalid ? 'true' : undefined"
      data-cm-input-control
      @input="updateValue"
    />
    <span v-if="hasTrailing" class="cm-input__trailing"><slot name="trailing" /></span>
    <button
      v-if="hasPasswordReveal"
      class="cm-input__action"
      type="button"
      :aria-label="passwordVisible ? props.hidePasswordLabel : props.showPasswordLabel"
      :aria-pressed="passwordVisible"
      data-cm-input-password
      :data-cm-input-show-password-label="props.showPasswordLabel"
      :data-cm-input-hide-password-label="props.hidePasswordLabel"
      @mousedown.prevent
      @click="togglePassword"
    >
      <span aria-hidden="true">◉</span>
    </button>
    <button
      v-if="hasClear"
      class="cm-input__action"
      type="button"
      :aria-label="props.clearLabel"
      :hidden="currentValue.length === 0"
      data-cm-input-clear
      @mousedown.prevent
      @click="clearValue"
    >
      <span aria-hidden="true">×</span>
    </button>
  </div>
  <input
    v-else
    ref="inputRef"
    v-bind="rootAttrs"
    :class="classes"
    :type="inputType"
    :value="currentValue"
    :disabled="props.disabled || undefined"
    :readonly="props.readonly || undefined"
    :required="props.required || undefined"
    :aria-invalid="props.invalid ? 'true' : undefined"
    @input="updateValue"
  />
</template>
