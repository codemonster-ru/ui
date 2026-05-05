<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { cx } from '@/utils/classes';
import type { VfControlSize } from '@/types/components';

defineOptions({
  inheritAttrs: false,
});

interface VfTextareaProps {
  modelValue?: string;
  size?: VfControlSize;
  invalid?: boolean;
}

const props = withDefaults(defineProps<VfTextareaProps>(), {
  modelValue: '',
  size: 'md',
  invalid: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const attrs = useAttrs();

const classes = computed(() =>
  cx('vf-textarea', props.size !== 'md' && `vf-textarea--${props.size}`, props.invalid && 'vf-textarea--invalid'),
);

function handleInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value);
}
</script>

<template>
  <textarea
    :class="classes"
    :value="props.modelValue"
    :aria-invalid="props.invalid || undefined"
    v-bind="attrs"
    @input="handleInput"
  />
</template>
