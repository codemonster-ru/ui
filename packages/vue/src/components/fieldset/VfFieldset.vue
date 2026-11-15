<script setup lang="ts">
import { useId } from 'vue';
import FieldsetSurface from './FieldsetSurface.vue';
import type { CmFieldsetDefaultSlotProps } from './fieldset.types';

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  label?: string;
  description?: string;
  error?: string;
  invalid?: boolean;
}>();
defineSlots<{
  default?: (props: CmFieldsetDefaultSlotProps) => unknown;
  label?: () => unknown;
  description?: () => unknown;
  error?: () => unknown;
}>();
const messageRoot = `cm-fieldset-${useId()}`;
</script>

<template>
  <FieldsetSurface v-bind="{ ...$attrs, ...props }" :message-root="messageRoot" :always-show-legend="false">
    <template #default="scope"><slot v-bind="scope" /></template>
    <template v-if="$slots.label" #legend><slot name="label" /></template>
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <template v-if="$slots.error" #error><slot name="error" /></template>
  </FieldsetSurface>
</template>
