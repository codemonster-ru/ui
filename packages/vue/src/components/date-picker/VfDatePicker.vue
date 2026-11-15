<script setup lang="ts">
import { useId } from 'vue';

import CmDatePicker from './CmDatePicker.vue';
import type { VfDatePickerProps } from './date-picker.types';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<VfDatePickerProps>(), {
  firstDayOfWeek: 1,
  teleportTo: 'body',
});
const emit = defineEmits<{ 'update:modelValue': [value: string | string[]] }>();
const generatedId = useId();
const runtimeLocale = Intl.DateTimeFormat().resolvedOptions().locale;
</script>

<template>
  <CmDatePicker
    v-bind="{ ...$attrs, ...props }"
    :id="props.id ?? generatedId"
    :locale="props.locale ?? runtimeLocale"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
