<script setup lang="ts">
import { computed, provide, useAttrs, useId, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import { cmFloatingFieldKey } from './floating-field';
import type { CmFieldDefaultSlotProps, CmFieldFloatingVariant, CmFieldLabelPlacement } from './field.types';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  controlId: {
    type: String,
    default: undefined,
    validator: (value: string) => value.trim().length > 0,
  },
  label: { type: String, default: null },
  description: { type: String, default: null },
  error: { type: String, default: null },
  invalid: Boolean,
  required: Boolean,
  labelPlacement: { type: String as PropType<CmFieldLabelPlacement>, default: 'top' },
  floatingVariant: { type: String as PropType<CmFieldFloatingVariant>, default: 'in' },
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
const authoredId = `cm-field-${useId()}`;
const controlId = computed(() => props.controlId || authoredId);
const descriptionId = computed(() => `${controlId.value}-description`);
const errorId = computed(() => `${controlId.value}-error`);
const floating = computed(() => hasLabel.value && props.labelPlacement === 'floating');
provide(cmFloatingFieldKey, floating);
const describedBy = computed(() => {
  const ids = [
    hasDescription.value ? descriptionId.value : undefined,
    hasError.value ? errorId.value : undefined,
  ].filter((value): value is string => Boolean(value));
  return ids.length > 0 ? ids.join(' ') : undefined;
});
const classes = computed(() =>
  mergeCmClasses(
    'cm-field',
    isInvalid.value ? 'cm-field--invalid' : undefined,
    floating.value ? `cm-field--floating cm-field--floating-${props.floatingVariant}` : undefined,
    attrs.class,
  ),
);
const rootAttrs = () => omitCmOwnedAttrs(attrs, []);
const defaultSlotProps = computed<CmFieldDefaultSlotProps>(() => ({
  controlId: controlId.value,
  describedBy: describedBy.value,
  invalid: isInvalid.value,
  required: props.required,
}));
</script>

<template>
  <div v-bind="rootAttrs()" :class="classes">
    <label v-if="hasLabel" class="cm-field__label" :for="controlId">
      <slot name="label">{{ props.label }}</slot
      ><span v-if="props.required" class="cm-field__required" aria-hidden="true">*</span>
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
