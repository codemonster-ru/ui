<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import { useCmFormReset } from '../../internal/form-reset';
import CmRadio from './CmRadio.vue';
import type { VfRadioProps, VfRadioValue } from './radio.types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<VfRadioProps>(), { modelValue: undefined });
const emit = defineEmits<{ 'update:modelValue': [value: VfRadioValue]; change: [value: VfRadioValue] }>();
defineSlots<{ default?(): unknown }>();

const radio = useTemplateRef<{ $el?: HTMLElement }>('radio');
const input = computed(() => radio.value?.$el?.querySelector('input') ?? null);
const initialValue = props.modelValue;
useCmFormReset(input, () => {
  if (props.modelValue === props.value && initialValue !== undefined && initialValue !== props.value)
    emit('update:modelValue', initialValue);
});

function selectValue(event: Event): void {
  if (!(event.target as HTMLInputElement).checked) return;
  const value = props.value;
  emit('update:modelValue', value);
  emit('change', value);
}
</script>

<template>
  <CmRadio
    ref="radio"
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
