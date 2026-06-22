<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, useAttrs, watch } from 'vue';
import { cx } from '@/utils/classes';
import type { VfControlSize } from '@/types/components';
import { vfFieldContextKey } from '@/components/field/context';

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
const fieldContext = inject(vfFieldContextKey, null);
const currentValue = ref(props.modelValue);
const hasValue = computed(() => String(currentValue.value ?? '').length > 0);
const isFloatingLabel = computed(() => fieldContext?.labelPlacement.value === 'floating');

fieldContext?.setFloatingSupported(true);

watch(
  () => props.modelValue,
  (value) => {
    currentValue.value = value;
  },
);

const classes = computed(() =>
  cx(
    'vf-textarea',
    props.size !== 'md' && `vf-textarea--${props.size}`,
    props.invalid && 'vf-textarea--invalid',
    isFloatingLabel.value && 'vf-textarea--floating',
  ),
);

watch(
  hasValue,
  (value) => {
    fieldContext?.setFilled(value);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  fieldContext?.setFloatingSupported(false);
  fieldContext?.setFilled(false);
});

function handleInput(event: Event) {
  const value = (event.target as HTMLTextAreaElement).value;
  currentValue.value = value;
  emit('update:modelValue', value);
}
</script>

<template>
  <textarea
    :class="classes"
    :value="currentValue"
    :data-vf-filled="hasValue || undefined"
    :aria-invalid="props.invalid || undefined"
    v-bind="attrs"
    @input="handleInput"
  />
</template>
