<script setup lang="ts">
import CmRadio from './CmRadio.vue';
import type { VfRadioProps, VfRadioValue } from './radio.types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<VfRadioProps>(), { modelValue: undefined });
const emit = defineEmits<{ 'update:modelValue': [value: VfRadioValue]; change: [value: VfRadioValue] }>();
defineSlots<{ default?(): unknown }>();

function selectValue(event: Event): void {
  if (!(event.target as HTMLInputElement).checked) return;
  const value = props.value;
  emit('update:modelValue', value);
  emit('change', value);
}
</script>

<template>
  <CmRadio
    v-bind="{ ...$attrs, ...props }"
    :value="String(props.value)"
    :model-value="props.modelValue === props.value ? String(props.value) : undefined"
    @change="selectValue"
  >
    <template v-if="$slots.default" #default
      ><slot>{{ props.label }}</slot></template
    >
  </CmRadio>
</template>
