<script setup lang="ts">
import { computed, useAttrs } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import type { CmFieldDefaultSlotProps } from './field.types';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  controlId: {
    type: String,
    required: true,
    validator: (value: string) => value.trim().length > 0,
  },
  label: { type: String, default: null },
  description: { type: String, default: null },
  error: { type: String, default: null },
  invalid: Boolean,
  required: Boolean,
});
const slots = defineSlots<{
  default?: (props: CmFieldDefaultSlotProps) => unknown;
  label?: () => unknown;
  description?: () => unknown;
  error?: () => unknown;
}>();
const attrs = useAttrs();
const hasLabel = computed(() => Boolean(slots.label) || Boolean(props.label));
const hasDescription = computed(() => Boolean(slots.description) || Boolean(props.description));
const hasError = computed(() => Boolean(slots.error) || Boolean(props.error));
const isInvalid = computed(() => props.invalid || hasError.value);
const descriptionId = computed(() => `${props.controlId}-description`);
const errorId = computed(() => `${props.controlId}-error`);
const describedBy = computed(() => {
  const ids = [
    hasDescription.value ? descriptionId.value : undefined,
    hasError.value ? errorId.value : undefined,
  ].filter((value): value is string => Boolean(value));
  return ids.length > 0 ? ids.join(' ') : undefined;
});
const classes = computed(() =>
  mergeCmClasses('cm-field', isInvalid.value ? 'cm-field--invalid' : undefined, attrs.class as CmClassValue),
);
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, []));
const defaultSlotProps = computed<CmFieldDefaultSlotProps>(() => ({
  controlId: props.controlId,
  describedBy: describedBy.value,
  invalid: isInvalid.value,
  required: props.required,
}));
</script>

<template>
  <div v-bind="rootAttrs" :class="classes">
    <label v-if="hasLabel" class="cm-field__label" :for="props.controlId">
      <slot name="label">{{ props.label }}</slot><span v-if="props.required" class="cm-field__required" aria-hidden="true">*</span>
    </label>
    <div class="cm-field__control"><slot v-bind="defaultSlotProps" /></div>
    <p v-if="hasDescription" :id="descriptionId" class="cm-field__description">
      <slot name="description">{{ props.description }}</slot>
    </p>
    <p v-if="hasError" :id="errorId" class="cm-field__error">
      <slot name="error">{{ props.error }}</slot>
    </p>
  </div>
</template>
