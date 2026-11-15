<script setup lang="ts">
import { useId } from 'vue';
import CmPopover from './CmPopover.vue';
import type { VfPopoverProps } from './popover.types';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<VfPopoverProps>(), {
  open: undefined,
  label: 'Details',
  teleportTo: 'body',
  focusOnOpen: true,
  closeOnEscape: true,
  closeOnOutsideClick: true,
});
const emit = defineEmits<{ 'update:open': [open: boolean]; openChange: [open: boolean] }>();
const slots = defineSlots<{
  trigger?(scope: { open: boolean; toggle: (event?: MouseEvent) => void }): unknown;
  default?(scope: { open: boolean; close: () => void }): unknown;
}>();
const fallbackId = useId();
</script>

<template>
  <CmPopover
    v-bind="{ ...$attrs, ...props }"
    :id="props.id ?? fallbackId"
    trigger-as-child
    @update:open="emit('update:open', $event)"
    @open-change="emit('openChange', $event)"
  >
    <template v-if="slots.trigger" #trigger="scope"><slot name="trigger" v-bind="scope" /></template>
    <template v-if="slots.default" #default="scope"><slot v-bind="scope" /></template>
  </CmPopover>
</template>
