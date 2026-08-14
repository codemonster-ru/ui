<script setup lang="ts">
import { computed, useAttrs } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import type { CmFieldsetDefaultSlotProps } from './fieldset.types';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  id: {
    type: String,
    required: true,
    validator: (value: string) => value.trim().length > 0,
  },
  label: {
    type: String,
    required: true,
    validator: (value: string) => value.trim().length > 0,
  },
  description: { type: String, default: null },
  error: { type: String, default: null },
  invalid: Boolean,
});
const slots = defineSlots<{
  default?: (props: CmFieldsetDefaultSlotProps) => unknown;
  legend?: () => unknown;
  description?: () => unknown;
  error?: () => unknown;
}>();
const attrs = useAttrs();
const hasDescription = computed(() => Boolean(slots.description) || Boolean(props.description));
const hasError = computed(() => Boolean(slots.error) || Boolean(props.error));
const isInvalid = computed(() => Boolean(props.invalid) || hasError.value);
const descriptionId = computed(() => `${props.id}-description`);
const errorId = computed(() => `${props.id}-error`);
const describedBy = computed(() => {
  const ids = [
    hasDescription.value ? descriptionId.value : undefined,
    hasError.value ? errorId.value : undefined,
  ].filter((value): value is string => Boolean(value));

  return ids.length > 0 ? ids.join(' ') : undefined;
});
const classes = computed(() =>
  mergeCmClasses('cm-fieldset', isInvalid.value ? 'cm-fieldset--invalid' : undefined, attrs.class as CmClassValue),
);
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['id', 'aria-describedby', 'aria-invalid']));
const defaultSlotProps = computed<CmFieldsetDefaultSlotProps>(() => ({
  describedBy: describedBy.value,
  invalid: isInvalid.value,
}));
</script>

<template>
  <fieldset
    v-bind="rootAttrs"
    :id="props.id"
    :class="classes"
    :aria-describedby="describedBy"
    :aria-invalid="isInvalid || undefined"
  >
    <legend class="cm-fieldset__legend">
      <slot name="legend">{{ props.label }}</slot>
    </legend>
    <div class="cm-fieldset__content"><slot v-bind="defaultSlotProps" /></div>
    <p v-if="hasDescription" :id="descriptionId" class="cm-fieldset__description">
      <slot name="description">{{ props.description }}</slot>
    </p>
    <p v-if="hasError" :id="errorId" class="cm-fieldset__error">
      <slot name="error">{{ props.error }}</slot>
    </p>
  </fieldset>
</template>
