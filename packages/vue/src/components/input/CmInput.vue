<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';

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
});
const emit = defineEmits<{
  input: [event: Event];
  'update:modelValue': [value: string];
}>();
const attrs = useAttrs();
const inputType = computed(() => (types.includes(props.type) ? props.type : 'text'));
const size = computed(() => (sizes.includes(props.size) ? props.size : 'md'));
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
  emit('update:modelValue', (event.target as HTMLInputElement).value);
  emit('input', event);
}
</script>

<template>
  <input
    v-bind="rootAttrs"
    :class="classes"
    :type="inputType"
    :value="props.modelValue"
    :disabled="props.disabled || undefined"
    :readonly="props.readonly || undefined"
    :required="props.required || undefined"
    :aria-invalid="props.invalid ? 'true' : undefined"
    @input="updateValue"
  />
</template>
