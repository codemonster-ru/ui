<script setup lang="ts">
import FieldsetSurface from './FieldsetSurface.vue';
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
defineSlots<{
  default?: (props: CmFieldsetDefaultSlotProps) => unknown;
  legend?: () => unknown;
  description?: () => unknown;
  error?: () => unknown;
}>();
</script>

<template>
  <FieldsetSurface v-bind="{ ...$attrs, ...props }" :message-root="props.id" always-show-legend>
    <template #default="scope"><slot v-bind="scope" /></template>
    <template v-if="$slots.legend" #legend><slot name="legend" /></template>
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <template v-if="$slots.error" #error><slot name="error" /></template>
  </FieldsetSurface>
</template>
