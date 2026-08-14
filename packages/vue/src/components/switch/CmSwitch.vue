<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import type { CmSwitchSize } from './switch.types';

defineOptions({ inheritAttrs: false });

const sizes: readonly CmSwitchSize[] = ['sm', 'md', 'lg'];
const props = defineProps({
  modelValue: Boolean,
  value: { type: String, default: 'on' },
  label: { type: String, default: '' },
  size: {
    type: String as PropType<CmSwitchSize>,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg'].includes(value),
  },
  invalid: Boolean,
  disabled: Boolean,
  required: Boolean,
});
const emit = defineEmits<{
  change: [event: Event];
  'update:modelValue': [value: boolean];
}>();
defineSlots<{
  default?(): unknown;
  thumb?(props: { checked: boolean }): unknown;
}>();
const attrs = useAttrs();
const size = computed(() => (sizes.includes(props.size) ? props.size : 'md'));
const classes = computed(() =>
  mergeCmClasses(
    'cm-switch',
    `cm-switch--${size.value}`,
    props.invalid ? 'cm-switch--invalid' : undefined,
    attrs.class as CmClassValue,
  ),
);
const controlAttrs = computed(() =>
  omitCmOwnedAttrs(attrs, [
    'style',
    'type',
    'role',
    'value',
    'checked',
    'disabled',
    'required',
    'aria-checked',
    'aria-invalid',
  ]),
);
const rootAttrs = computed(() => (attrs.style === undefined ? {} : { style: attrs.style }));

function updateChecked(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).checked);
  emit('change', event);
}
</script>

<template>
  <label v-bind="rootAttrs" :class="classes">
    <input
      v-bind="controlAttrs"
      class="cm-switch__input"
      type="checkbox"
      role="switch"
      :value="props.value"
      :checked="props.modelValue"
      :disabled="props.disabled || undefined"
      :required="props.required || undefined"
      :aria-checked="props.modelValue ? 'true' : 'false'"
      :aria-invalid="props.invalid ? 'true' : undefined"
      @change="updateChecked"
    />
    <span class="cm-switch__control" aria-hidden="true">
      <span class="cm-switch__thumb"><slot name="thumb" :checked="props.modelValue" /></span>
    </span>
    <span class="cm-switch__content"
      ><slot>{{ props.label }}</slot></span
    >
  </label>
</template>
