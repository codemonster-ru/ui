<script setup lang="ts">
import { computed, ref, useAttrs, watch, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import type { CmDatePickerSize } from './date-picker.types';

defineOptions({ inheritAttrs: false });
const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/u;

function validDate(value: string): boolean {
  if (value === '') return true;
  const match = datePattern.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
const props = defineProps({
  modelValue: { type: String, default: '' },
  min: { type: String, default: null },
  max: { type: String, default: null },
  size: {
    type: String as PropType<CmDatePickerSize>,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg'].includes(value),
  },
  invalid: Boolean,
  disabled: Boolean,
  readonly: Boolean,
  required: Boolean,
  clearable: Boolean,
  clearLabel: { type: String, default: 'Clear date' },
});
const emit = defineEmits<{ valueChange: [value: string]; 'update:modelValue': [value: string] }>();
const attrs = useAttrs();
const inputRef = ref<HTMLInputElement | null>(null);
const currentValue = ref(props.modelValue);
watch(
  () => props.modelValue,
  (value) => {
    currentValue.value = value;
  },
);
for (const value of [props.modelValue, props.min ?? '', props.max ?? '']) {
  if (!validDate(value)) throw new TypeError(`DatePicker value must be a valid YYYY-MM-DD date: ${value}.`);
}
const size = computed(() => (['sm', 'md', 'lg'].includes(props.size) ? props.size : 'md'));
const hasClear = computed(() => props.clearable && !props.disabled && !props.readonly);
const classes = computed(() =>
  mergeCmClasses(
    'cm-date-picker',
    `cm-date-picker--${size.value}`,
    props.invalid ? 'cm-date-picker--invalid' : undefined,
    attrs.class as CmClassValue,
  ),
);
const rootAttrs = computed(() =>
  omitCmOwnedAttrs(attrs, [
    'type',
    'value',
    'min',
    'max',
    'disabled',
    'readonly',
    'required',
    'aria-invalid',
    'data-cm-input-control',
  ]),
);

function onInput(event: Event): void {
  const value = (event.target as HTMLInputElement).value;
  currentValue.value = value;
  emit('update:modelValue', value);
  emit('valueChange', value);
}

function clearValue(): void {
  const input = inputRef.value;
  if (!input) return;
  input.value = '';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.focus();
}
</script>

<template>
  <div v-if="hasClear" class="cm-date-picker-wrap" data-cm-controller="input">
    <input
      ref="inputRef"
      v-bind="rootAttrs"
      :class="classes"
      type="date"
      :value="currentValue"
      :min="props.min || undefined"
      :max="props.max || undefined"
      :aria-invalid="props.invalid ? 'true' : undefined"
      :disabled="props.disabled || undefined"
      :readonly="props.readonly || undefined"
      :required="props.required || undefined"
      data-cm-input-control
      @input="onInput"
    />
    <button
      class="cm-date-picker__clear"
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
    type="date"
    :value="currentValue"
    :min="props.min || undefined"
    :max="props.max || undefined"
    :aria-invalid="props.invalid ? 'true' : undefined"
    :disabled="props.disabled || undefined"
    :readonly="props.readonly || undefined"
    :required="props.required || undefined"
    @input="onInput"
  />
</template>
