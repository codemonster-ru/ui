<script setup lang="ts">
import { computed, useAttrs, type StyleValue } from 'vue';
import { cx } from '@/utils/classes';
import type { VfControlSize } from '@/types/components';

defineOptions({
  inheritAttrs: false,
});

interface VfCheckboxProps {
  modelValue?: boolean;
  size?: VfControlSize;
  invalid?: boolean;
  disabled?: boolean;
  label?: string;
}

const props = withDefaults(defineProps<VfCheckboxProps>(), {
  modelValue: false,
  size: 'md',
  invalid: false,
  disabled: false,
  label: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  change: [value: boolean];
}>();

const attrs = useAttrs();

const rootClasses = computed(() =>
  cx(
    'vf-checkbox',
    `vf-checkbox--${props.size}`,
    props.modelValue && 'vf-checkbox--checked',
    props.invalid && 'vf-checkbox--invalid',
    props.disabled && 'vf-checkbox--disabled',
    attrs.class as string | undefined,
  ),
);

const rootStyles = computed<StyleValue>(() => attrs.style as StyleValue);
const inputAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'class' && key !== 'style')),
);

function handleChange(event: Event) {
  const nextValue = (event.target as HTMLInputElement).checked;
  emit('update:modelValue', nextValue);
  emit('change', nextValue);
}
</script>

<template>
  <label :class="rootClasses" :style="rootStyles">
    <input
      class="vf-checkbox__input"
      type="checkbox"
      :checked="props.modelValue"
      :disabled="props.disabled"
      :aria-invalid="props.invalid || undefined"
      v-bind="inputAttrs"
      @change="handleChange"
    />
    <span class="vf-checkbox__control" aria-hidden="true">
      <span class="vf-checkbox__mark" />
    </span>
    <span v-if="label || $slots.default" class="vf-checkbox__content">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>
