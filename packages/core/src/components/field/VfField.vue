<script setup lang="ts">
import { computed, provide, ref, toRef, useSlots } from 'vue';
import { useId } from '@/composables';
import { cx } from '@/utils/classes';
import { vfFieldContextKey, type VfFieldFloatingVariant, type VfFieldLabelPlacement } from './context';

interface VfFieldProps {
  label?: string;
  description?: string;
  error?: string;
  invalid?: boolean;
  labelPlacement?: VfFieldLabelPlacement;
  floatingVariant?: VfFieldFloatingVariant;
}

const props = withDefaults(defineProps<VfFieldProps>(), {
  label: undefined,
  description: undefined,
  error: undefined,
  invalid: false,
  labelPlacement: 'top',
  floatingVariant: 'in',
});

const slots = useSlots();
const controlId = useId({ prefix: 'vf-field-control' });
const descriptionId = useId({ prefix: 'vf-field-description' });
const errorId = useId({ prefix: 'vf-field-error' });
const isFilled = ref(false);
const supportsFloatingLabel = ref(false);

const hasLabel = computed(() => Boolean(props.label) || Boolean(slots.label));
const hasDescription = computed(() => Boolean(props.description) || Boolean(slots.description));
const hasError = computed(() => Boolean(props.error) || Boolean(slots.error));
const isInvalid = computed(() => props.invalid || hasError.value);
const isFloatingLabel = computed(
  () => props.labelPlacement === 'floating' && hasLabel.value && supportsFloatingLabel.value,
);
const describedBy = computed(() => {
  const ids = [
    hasDescription.value ? descriptionId.value : undefined,
    hasError.value ? errorId.value : undefined,
  ].filter((value): value is string => Boolean(value));

  return ids.length > 0 ? ids.join(' ') : undefined;
});
const rootClasses = computed(() =>
  cx(
    'vf-field',
    isInvalid.value && 'vf-field--invalid',
    isFloatingLabel.value && 'vf-field--floating',
    isFloatingLabel.value && `vf-field--floating-${props.floatingVariant}`,
  ),
);
const controlClasses = computed(() =>
  cx(
    'vf-field__control',
    isFloatingLabel.value && 'vf-field__control--floating',
    isFilled.value && 'vf-field__control--filled',
  ),
);

provide(vfFieldContextKey, {
  labelPlacement: toRef(props, 'labelPlacement'),
  setFilled(value) {
    isFilled.value = value;
  },
  setFloatingSupported(value) {
    supportsFloatingLabel.value = value;
  },
});
</script>

<template>
  <div :class="rootClasses">
    <label v-if="hasLabel && !isFloatingLabel" :for="controlId" class="vf-field__label">
      <slot name="label">{{ props.label }}</slot>
    </label>

    <div :class="controlClasses">
      <slot :control-id="controlId" :described-by="describedBy" :invalid="isInvalid" />

      <label v-if="hasLabel && isFloatingLabel" :for="controlId" class="vf-field__label vf-field__label--floating">
        <slot name="label">{{ props.label }}</slot>
      </label>
    </div>

    <p v-if="hasDescription" :id="descriptionId" class="vf-field__description">
      <slot name="description">{{ props.description }}</slot>
    </p>

    <p v-if="hasError" :id="errorId" class="vf-field__error">
      <slot name="error">{{ props.error }}</slot>
    </p>
  </div>
</template>
