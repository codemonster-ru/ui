<script setup lang="ts">
import { computed, useSlots } from 'vue';
import {
  isFieldsetInvalid,
  resolveFieldsetClasses,
  resolveFieldsetDescribedBy,
  resolveFieldsetPresence,
} from '@codemonster-ru/vueforge-shared-core';
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
const noSlots = { hasLabelSlot: false, hasDescriptionSlot: false, hasErrorSlot: false };
const descriptionId = useId({ prefix: 'vf-fieldset-description' });
const errorId = useId({ prefix: 'vf-fieldset-error' });

// Each part is its own computed over the props it reads and useSlots(), as in
// the reference: a slot a parent adds after mount is only seen once that
// part's prop changes. The characterization suite pins it.
const hasLabel = computed(
  () => resolveFieldsetPresence({ ...noSlots, label: props.label, hasLabelSlot: Boolean(slots.label) }).label,
);
const hasDescription = computed(
  () =>
    resolveFieldsetPresence({
      ...noSlots,
      description: props.description,
      hasDescriptionSlot: Boolean(slots.description),
    }).description,
);
const hasError = computed(
  () => resolveFieldsetPresence({ ...noSlots, error: props.error, hasErrorSlot: Boolean(slots.error) }).error,
);
const isInvalid = computed(() => isFieldsetInvalid({ invalid: props.invalid, hasError: hasError.value }));
const describedBy = computed(() =>
  resolveFieldsetDescribedBy({
    descriptionId: descriptionId.value,
    errorId: errorId.value,
    hasDescription: hasDescription.value,
    hasError: hasError.value,
  }),
);
const rootClasses = computed(() => cx(...resolveFieldsetClasses(isInvalid.value)));
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
