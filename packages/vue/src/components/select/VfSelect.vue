<script setup lang="ts">
import { useId } from 'vue';
import VueIconify from '../icon/VueIconify.vue';
import CmSelect from './CmSelect.vue';
import type { VfSelectProps } from './select.types';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<VfSelectProps>(), {
  teleportTo: 'body',
  clearLabel: 'Clear select',
});
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const fallbackId = useId();
</script>

<template>
  <CmSelect
    v-bind="$attrs"
    :id="props.id ?? fallbackId"
    :options="props.options"
    :model-value="props.modelValue"
    :size="props.size"
    :invalid="props.invalid"
    :clearable="props.clearable"
    :clear-label="props.clearLabel"
    :placeholder="props.placeholder ?? undefined"
    :disabled="props.disabled"
    :required="props.required"
    :placement="props.placement"
    :teleport-to="props.teleportTo"
    :disable-teleport="props.disableTeleport"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-if="props.leadingIcon || $slots.leading" #leading>
      <slot name="leading"><VueIconify v-if="props.leadingIcon" :icon="props.leadingIcon" size="100%" /></slot>
    </template>
    <template v-if="props.trailingIcon || $slots.trailing" #trailing>
      <slot name="trailing"><VueIconify v-if="props.trailingIcon" :icon="props.trailingIcon" size="100%" /></slot>
    </template>
  </CmSelect>
</template>
