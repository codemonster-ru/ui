<script setup lang="ts">
import { computed, inject, useAttrs, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import { cmFloatingFieldKey } from '../field/floating-field';
import type { CmTextareaSize } from './textarea.types';

defineOptions({ inheritAttrs: false });

const sizes: readonly CmTextareaSize[] = ['sm', 'md', 'lg'];
const props = defineProps({
  modelValue: { type: String, default: '' },
  size: {
    type: String as PropType<CmTextareaSize>,
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
const floatingLabel = inject(cmFloatingFieldKey, null);
const size = computed(() => (sizes.includes(props.size) ? props.size : 'md'));
const classes = computed(() =>
  mergeCmClasses(
    'cm-textarea',
    `cm-textarea--${size.value}`,
    props.invalid ? 'cm-textarea--invalid' : undefined,
    attrs.class,
  ),
);
const rootAttrs = computed(() => ({
  ...omitCmOwnedAttrs(attrs, ['value', 'disabled', 'readonly', 'required', 'aria-invalid', 'onInput']),
  ...(floatingLabel?.value && !attrs.placeholder ? { placeholder: ' ' } : {}),
}));

function updateValue(event: Event): void {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value);
  emit('input', event);
}
</script>

<template>
  <textarea
    v-bind="rootAttrs"
    :class="classes"
    :value="props.modelValue"
    :disabled="props.disabled || undefined"
    :readonly="props.readonly || undefined"
    :required="props.required || undefined"
    :aria-invalid="props.invalid ? 'true' : undefined"
    @input="updateValue"
  />
</template>
