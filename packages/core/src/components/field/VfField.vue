<script setup lang="ts">
import { computed, provide, ref, toRef } from 'vue';
import {
  isFieldFloatingLabel,
  isFieldInvalid,
  resolveFieldClasses,
  resolveFieldControlClasses,
  resolveFieldDescribedBy,
} from '@codemonster-ru/vueforge-shared-core';
import { useId } from '@/composables';
import { cx } from '@/utils/classes';
import { vfFieldContextKey, type VfFieldFloatingVariant, type VfFieldLabelPlacement } from './context';

interface VfFieldProps {
  label?: string;
  description?: string;
  error?: string;
  invalid?: boolean;
  required?: boolean;
  labelPlacement?: VfFieldLabelPlacement;
  floatingVariant?: VfFieldFloatingVariant;
}

interface VfFieldDefaultSlotScope {
  controlId: string;
  describedBy?: string;
  invalid: boolean;
  required: boolean;
}

const props = withDefaults(defineProps<VfFieldProps>(), {
  label: undefined,
  description: undefined,
  error: undefined,
  invalid: false,
  required: false,
  labelPlacement: 'top',
  floatingVariant: 'in',
});

const slots = defineSlots<{
  default?: (scope: VfFieldDefaultSlotScope) => unknown;
  label?: () => unknown;
  description?: () => unknown;
  error?: () => unknown;
}>();
const controlId = useId({ prefix: 'vf-field-control' });
const descriptionId = useId({ prefix: 'vf-field-description' });
const errorId = useId({ prefix: 'vf-field-error' });
const isFilled = ref(false);
const supportsFloatingLabel = ref(false);

const hasLabel = computed(() => Boolean(props.label) || Boolean(slots.label));
const hasDescription = computed(() => Boolean(props.description) || Boolean(slots.description));
const hasError = computed(() => Boolean(props.error) || Boolean(slots.error));
// The derivations below are the shared rules, not a second copy of them: the
// Razor adapter runs the same functions through packages/razor's PHP mirror,
// which is checked against the same vectors. What stays here is everything that
// is genuinely Vue - the provide/inject channel, the refs the control writes
// into, and the reactivity that re-renders when it does.
const isInvalid = computed(() => isFieldInvalid({ invalid: props.invalid, hasError: hasError.value }));
const isFloatingLabel = computed(() =>
  isFieldFloatingLabel({
    labelPlacement: props.labelPlacement,
    hasLabel: hasLabel.value,
    controlSupportsFloating: supportsFloatingLabel.value,
  }),
);
const describedBy = computed(() =>
  resolveFieldDescribedBy({
    descriptionId: descriptionId.value,
    errorId: errorId.value,
    hasDescription: hasDescription.value,
    hasError: hasError.value,
  }),
);
const rootClasses = computed(() =>
  cx(
    ...resolveFieldClasses({
      invalid: isInvalid.value,
      floating: isFloatingLabel.value,
      floatingVariant: props.floatingVariant,
    }),
  ),
);
const controlClasses = computed(() =>
  cx(...resolveFieldControlClasses({ floating: isFloatingLabel.value, filled: isFilled.value })),
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
      <slot name="label">{{ props.label }}</slot
      ><span v-if="props.required" class="vf-field__required-mark" aria-hidden="true">*</span>
    </label>

    <div :class="controlClasses">
      <slot :control-id="controlId" :described-by="describedBy" :invalid="isInvalid" :required="props.required" />

      <label v-if="hasLabel && isFloatingLabel" :for="controlId" class="vf-field__label vf-field__label--floating">
        <slot name="label">{{ props.label }}</slot
        ><span v-if="props.required" class="vf-field__required-mark" aria-hidden="true">*</span>
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
