<script setup lang="ts">
import { ref, watch } from 'vue';
import CmTextarea from './CmTextarea.vue';
import type { CmTextareaSize } from './textarea.types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    size?: CmTextareaSize;
    invalid?: boolean;
  }>(),
  { modelValue: '', size: 'md' },
);
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const draft = ref(props.modelValue);

watch(
  () => props.modelValue,
  (value) => {
    draft.value = value;
  },
);

function updateDraft(value: string): void {
  draft.value = value;
  emit('update:modelValue', value);
}
</script>

<template>
  <CmTextarea
    v-bind="$attrs"
    :model-value="draft"
    :size="props.size"
    :invalid="props.invalid"
    @update:model-value="updateDraft"
  />
</template>
