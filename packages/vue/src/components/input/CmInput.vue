<script setup lang="ts">
import { computed, inject, nextTick, ref, useAttrs, watch, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import { useCmHydrated } from '../../internal/hydration';
import { resolveInputClearable, resolvePasswordReveal } from '@codemonster-ru/ui-runtime/core';
import { cmFloatingFieldKey } from '../field/floating-field';
import { cmInputTypes, type CmInputSize, type CmInputType } from './input.types';

defineOptions({ inheritAttrs: false });

const sizes: readonly CmInputSize[] = ['sm', 'md', 'lg'];
const props = defineProps({
  modelValue: { type: String, default: '' },
  type: {
    type: String as PropType<CmInputType>,
    default: 'text',
    validator: (value: CmInputType) => cmInputTypes.includes(value),
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
const floatingLabel = inject(cmFloatingFieldKey, null);
const inputRef = ref<HTMLInputElement | null>(null);
const currentValue = ref(props.modelValue);
const passwordVisible = ref(false);
watch(
  () => props.modelValue,
  (value) => {
    currentValue.value = value;
  },
);
const inputType = computed(() => (cmInputTypes.includes(props.type) ? props.type : 'text'));
const resolvedInputType = computed(() =>
  props.passwordReveal && inputType.value === 'password' ? passwordReveal.value.type : inputType.value,
);
const size = computed(() => (sizes.includes(props.size) ? props.size : 'md'));
const hasPasswordReveal = computed(() => props.passwordReveal && inputType.value === 'password');
const hasClear = computed(() =>
  resolveInputClearable({ clearable: props.clearable, disabled: props.disabled, readonly: props.readonly }),
);
const passwordReveal = computed(() =>
  resolvePasswordReveal(passwordVisible.value, { hide: props.hidePasswordLabel, show: props.showPasswordLabel }),
);
const classes = computed(() =>
  mergeCmClasses('cm-input', `cm-input--${size.value}`, props.invalid ? 'cm-input--invalid' : undefined, attrs.class),
);
const rootAttrs = computed(() => ({
  ...omitCmOwnedAttrs(attrs, ['value', 'type', 'disabled', 'readonly', 'required', 'aria-invalid', 'onInput']),
  ...(floatingLabel?.value && !attrs.placeholder ? { placeholder: ' ' } : {}),
}));

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
  const selection =
    input && input.selectionStart !== null && input.selectionEnd !== null
      ? { start: input.selectionStart, end: input.selectionEnd, direction: input.selectionDirection ?? undefined }
      : null;
  passwordVisible.value = !passwordVisible.value;
  await nextTick();
  const currentInput = inputRef.value;
  currentInput?.focus();
  if (selection && currentInput && currentInput.selectionStart !== null) {
    currentInput.setSelectionRange(selection.start, selection.end, selection.direction);
  }
}

useCmHydrated();
</script>

<template>
  <div
    v-if="$slots.leading || $slots.trailing || hasPasswordReveal || hasClear"
    class="cm-input-wrap"
    :data-cm-controller="hasPasswordReveal || hasClear ? 'input' : undefined"
  >
    <span v-if="$slots.leading" class="cm-input__leading"><slot name="leading" /></span>
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
    <span v-if="$slots.trailing" class="cm-input__trailing"><slot name="trailing" /></span>
    <button
      v-if="hasPasswordReveal"
      class="cm-input__action"
      type="button"
      :aria-label="passwordReveal.label"
      :aria-pressed="passwordReveal.ariaPressed"
      data-cm-input-password
      :data-cm-input-show-password-label="props.showPasswordLabel"
      :data-cm-input-hide-password-label="props.hidePasswordLabel"
      @mousedown.prevent
      @click="togglePassword"
    >
      <span aria-hidden="true">
        <svg
          class="cm-input__action-icon cm-input__action-icon--show"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          focusable="false"
        >
          <path d="M2.75 12C5.15 8.1 8.25 6 12 6s6.85 2.1 9.25 6c-2.4 3.9-5.5 6-9.25 6S5.15 15.9 2.75 12Z" />
          <circle cx="12" cy="12" r="3.25" /></svg
        ><svg
          class="cm-input__action-icon cm-input__action-icon--hide"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          focusable="false"
        >
          <path d="M2.75 12C5.15 8.1 8.25 6 12 6s6.85 2.1 9.25 6c-2.4 3.9-5.5 6-9.25 6S5.15 15.9 2.75 12Z" />
          <circle cx="12" cy="12" r="3.25" />
          <line x1="4" y1="4" x2="20" y2="20" />
        </svg>
      </span>
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
      <span aria-hidden="true">
        <svg
          class="cm-input__action-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          focusable="false"
        >
          <line x1="5.75" y1="5.75" x2="18.25" y2="18.25" />
          <line x1="18.25" y1="5.75" x2="5.75" y2="18.25" />
        </svg>
      </span>
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
