<script setup lang="ts">
import CmSwitch from './CmSwitch.vue';
import type { VfSwitchProps } from './switch.types';

defineOptions({ inheritAttrs: false });

const props = defineProps<VfSwitchProps>();
const emit = defineEmits<{ 'update:modelValue': [checked: boolean]; change: [checked: boolean] }>();
defineSlots<{
  default?(): unknown;
  thumb?(props: { checked: boolean }): unknown;
}>();

function updateChecked(checked: boolean): void {
  emit('update:modelValue', checked);
  emit('change', checked);
}
</script>

<template>
  <CmSwitch
    v-bind="{ ...$attrs, ...props }"
    :thumb-contrast="props.disabled ? 'auto' : props.thumbContrast"
    @update:model-value="updateChecked"
  >
    <template v-if="$slots.default" #default
      ><slot>{{ props.label }}</slot></template
    >
    <template v-if="$slots.thumb" #thumb="{ checked }"><slot name="thumb" :checked="checked" /></template>
  </CmSwitch>
</template>
