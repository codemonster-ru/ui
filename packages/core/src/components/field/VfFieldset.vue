<script setup lang="ts">
import { computed, useSlots } from 'vue';
import { useId } from '@/composables';
import { cx } from '@/utils/classes';

interface VfFieldsetProps {
  label?: string;
  description?: string;
  error?: string;
  invalid?: boolean;
}

const props = withDefaults(defineProps<VfFieldsetProps>(), {
  label: undefined,
  description: undefined,
  error: undefined,
  invalid: false,
});

const slots = useSlots();
const descriptionId = useId({ prefix: 'vf-fieldset-description' });
const errorId = useId({ prefix: 'vf-fieldset-error' });

const hasLabel = computed(() => Boolean(props.label) || Boolean(slots.label));
const hasDescription = computed(() => Boolean(props.description) || Boolean(slots.description));
const hasError = computed(() => Boolean(props.error) || Boolean(slots.error));
const isInvalid = computed(() => props.invalid || hasError.value);
const describedBy = computed(() => {
  const ids = [
    hasDescription.value ? descriptionId.value : undefined,
    hasError.value ? errorId.value : undefined,
  ].filter((value): value is string => Boolean(value));

  return ids.length > 0 ? ids.join(' ') : undefined;
});
const rootClasses = computed(() => cx('vf-fieldset', isInvalid.value && 'vf-fieldset--invalid'));
</script>

<template>
  <fieldset :class="rootClasses" :aria-describedby="describedBy">
    <legend v-if="hasLabel" class="vf-fieldset__legend">
      <slot name="label">{{ props.label }}</slot>
    </legend>

    <div class="vf-fieldset__control">
      <slot :described-by="describedBy" :invalid="isInvalid" />
    </div>

    <p v-if="hasDescription" :id="descriptionId" class="vf-fieldset__description">
      <slot name="description">{{ props.description }}</slot>
    </p>

    <p v-if="hasError" :id="errorId" class="vf-fieldset__error">
      <slot name="error">{{ props.error }}</slot>
    </p>
  </fieldset>
</template>
