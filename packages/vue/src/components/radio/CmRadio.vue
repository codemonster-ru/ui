<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import type { CmRadioSize } from './radio.types';

defineOptions({ inheritAttrs: false });

const sizes: readonly CmRadioSize[] = ['sm', 'md', 'lg'];
const props = defineProps({
  modelValue: { type: String, default: undefined },
  value: { type: String, required: true },
  label: { type: String, default: '' },
  size: {
    type: String as PropType<CmRadioSize>,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg'].includes(value),
  },
  invalid: Boolean,
  disabled: Boolean,
  required: Boolean,
});
const emit = defineEmits<{
  change: [event: Event];
  'update:modelValue': [value: string];
}>();
const attrs = useAttrs();
const size = computed(() => (sizes.includes(props.size) ? props.size : 'md'));
const classes = computed(() =>
  mergeCmClasses(
    'cm-radio',
    `cm-radio--${size.value}`,
    props.invalid ? 'cm-radio--invalid' : undefined,
    attrs.class as CmClassValue,
  ),
);
const controlAttrs = computed(() =>
  omitCmOwnedAttrs(attrs, ['style', 'type', 'value', 'checked', 'disabled', 'required', 'aria-invalid']),
);
const rootAttrs = computed(() => (attrs.style === undefined ? {} : { style: attrs.style }));

function selectValue(event: Event): void {
  emit('update:modelValue', props.value);
  emit('change', event);
}
</script>

<template>
  <label v-bind="rootAttrs" :class="classes">
    <input
      v-bind="controlAttrs"
      class="cm-radio__input"
      type="radio"
      :value="props.value"
      :checked="props.modelValue === props.value"
      :disabled="props.disabled || undefined"
      :required="props.required || undefined"
      :aria-invalid="props.invalid ? 'true' : undefined"
      @change="selectValue"
    />
    <span class="cm-radio__control" aria-hidden="true"><span class="cm-radio__mark" /></span>
    <span class="cm-radio__content"
      ><slot>{{ props.label }}</slot></span
    >
  </label>
</template>
