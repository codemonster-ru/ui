<script setup lang="ts">
import CmCheckbox from './CmCheckbox.vue';
import type { VfCheckboxProps } from './checkbox.types';

defineOptions({ inheritAttrs: false });

const props = defineProps<VfCheckboxProps>();
const emit = defineEmits<{ 'update:modelValue': [checked: boolean]; change: [checked: boolean] }>();
defineSlots<{ default?(): unknown }>();

function updateChecked(checked: boolean): void {
  emit('update:modelValue', checked);
  emit('change', checked);
}
</script>

<template>
  <CmCheckbox
    v-bind="{ ...$attrs, ...props }"
    :aria-checked="props.indeterminate ? 'mixed' : props.modelValue ? 'true' : 'false'"
    @update:model-value="updateChecked"
  >
    <template v-if="$slots.default" #default
      ><slot>{{ props.label }}</slot></template
    >
  </CmCheckbox>
</template>
