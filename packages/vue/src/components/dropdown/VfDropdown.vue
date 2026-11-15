<script setup lang="ts">
import { useId } from 'vue';
import CmDropdown from './CmDropdown.vue';
import type { CmDropdownContentScope, CmDropdownTriggerScope, VfDropdownProps } from './dropdown.types';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<VfDropdownProps>(), {
  open: undefined,
  label: 'Actions',
  teleportTo: 'body',
  closeOnSelect: true,
  showArrow: true,
});
const emit = defineEmits<{ 'update:open': [open: boolean]; openChange: [open: boolean] }>();
const slots = defineSlots<{
  trigger?(scope: CmDropdownTriggerScope): unknown;
  default?(scope: CmDropdownContentScope): unknown;
}>();
const fallbackId = useId();
</script>

<template>
  <CmDropdown
    v-bind="{ ...$attrs, ...props }"
    :id="props.id ?? fallbackId"
    trigger-as-child
    @update:open="emit('update:open', $event)"
    @open-change="emit('openChange', $event)"
  >
    <template v-if="slots.trigger" #trigger="scope"><slot name="trigger" v-bind="scope" /></template>
    <template v-if="slots.default" #default="scope"><slot v-bind="scope" /></template>
  </CmDropdown>
</template>
