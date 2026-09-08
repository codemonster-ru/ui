<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, useAttrs, watch } from 'vue';
import { isInputFilled, resolveTextareaClasses } from '@codemonster-ru/vueforge-shared-core';
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
// The same predicate VfInput uses: string length, not trimmed content, which
// is why whitespace counts as filled on both controls.
const hasValue = computed(() => isInputFilled(currentValue.value));
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
    ...resolveTextareaClasses({
      size: props.size,
      invalid: props.invalid,
      floating: isFloatingLabel.value,
    }),
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
