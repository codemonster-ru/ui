<script setup lang="ts">
import { computed, ref, useAttrs, watch, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import type { CmSelectOption, CmSelectSize } from './select.types';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  options: { type: Array as PropType<readonly CmSelectOption[]>, required: true },
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: null },
  size: {
    type: String as PropType<CmSelectSize>,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg'].includes(value),
  },
  invalid: Boolean,
  disabled: Boolean,
  required: Boolean,
  clearable: Boolean,
  clearLabel: { type: String, default: 'Clear selection' },
});
const emit = defineEmits<{ valueChange: [value: string]; 'update:modelValue': [value: string] }>();
const attrs = useAttrs();
const selectRef = ref<HTMLSelectElement | null>(null);
const currentValue = ref(props.modelValue);
watch(
  () => props.modelValue,
  (value) => {
    currentValue.value = value;
  },
);
const normalizedOptions = computed(() => {
  if (props.options.length === 0) throw new TypeError('Select requires options.');
  const values = new Set<string>();
  for (const option of props.options) {
    if (!option.label.trim() || values.has(option.value))
      throw new TypeError(`Invalid Select option: ${option.value}.`);
    values.add(option.value);
  }
  return props.options;
});
const size = computed(() => (['sm', 'md', 'lg'].includes(props.size) ? props.size : 'md'));
const classes = computed(() =>
  mergeCmClasses(
    'cm-select',
    `cm-select--${size.value}`,
    props.invalid ? 'cm-select--invalid' : undefined,
    attrs.class as CmClassValue,
  ),
);
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['value', 'disabled', 'required', 'aria-invalid']));
const hasClear = computed(() => props.clearable && !props.disabled);
const hasEmptyOption = computed(() => normalizedOptions.value.some((option) => option.value === ''));

function onChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value;
  currentValue.value = value;
  emit('update:modelValue', value);
  emit('valueChange', value);
}

function clearValue(): void {
  const select = selectRef.value;
  if (!select) return;
  select.value = '';
  select.dispatchEvent(new Event('change', { bubbles: true }));
  select.focus();
}
</script>

<template>
  <div v-if="hasClear" class="cm-select-wrap" data-cm-controller="select">
    <select
      ref="selectRef"
      v-bind="rootAttrs"
      :class="classes"
      :aria-invalid="props.invalid ? 'true' : undefined"
      :required="props.required || undefined"
      data-cm-select-control
      @change="onChange"
    >
      <option v-if="props.placeholder !== null" value="" disabled :selected="currentValue === ''">
        {{ props.placeholder }}
      </option>
      <option v-else-if="!hasEmptyOption" value="" hidden :selected="currentValue === ''"></option>
      <option
        v-for="option in normalizedOptions"
        :key="option.value"
        :value="option.value"
        :selected="currentValue === option.value"
        :disabled="option.disabled || undefined"
      >
        {{ option.label }}
      </option>
    </select>
    <button
      class="cm-select__clear"
      type="button"
      :aria-label="props.clearLabel"
      :hidden="currentValue === ''"
      data-cm-select-clear
      @mousedown.prevent
      @click="clearValue"
    >
      <span aria-hidden="true">×</span>
    </button>
  </div>
  <select
    v-else
    ref="selectRef"
    v-bind="rootAttrs"
    :class="classes"
    :aria-invalid="props.invalid ? 'true' : undefined"
    :disabled="props.disabled || undefined"
    :required="props.required || undefined"
    @change="onChange"
  >
    <option v-if="props.placeholder !== null" value="" disabled :selected="currentValue === ''">
      {{ props.placeholder }}
    </option>
    <option
      v-for="option in normalizedOptions"
      :key="option.value"
      :value="option.value"
      :selected="currentValue === option.value"
      :disabled="option.disabled || undefined"
    >
      {{ option.label }}
    </option>
  </select>
</template>
