<script setup lang="ts">
import { computed, useAttrs, type StyleValue } from 'vue';
import { cx } from '@/utils/classes';
import type { VfControlSize } from '@/types/components';

defineOptions({
  inheritAttrs: false,
});

type VfRadioValue = string | number | boolean;

interface VfRadioProps {
  modelValue?: VfRadioValue;
  value: VfRadioValue;
  size?: VfControlSize;
  invalid?: boolean;
  disabled?: boolean;
  label?: string;
}

const props = withDefaults(defineProps<VfRadioProps>(), {
  modelValue: undefined,
  size: 'md',
  invalid: false,
  disabled: false,
  label: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [value: VfRadioValue];
  change: [value: VfRadioValue];
}>();

const attrs = useAttrs();
const isChecked = computed(() => props.modelValue === props.value);

const rootClasses = computed(() =>
  cx(
    'vf-radio',
    `vf-radio--${props.size}`,
    isChecked.value && 'vf-radio--checked',
    props.invalid && 'vf-radio--invalid',
    props.disabled && 'vf-radio--disabled',
    attrs.class as string | undefined,
  ),
);

const rootStyles = computed<StyleValue>(() => attrs.style as StyleValue);
const inputAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'class' && key !== 'style')),
);

function handleChange(event: Event) {
  if (!(event.target as HTMLInputElement).checked) {
    return;
  }

  emit('update:modelValue', props.value);
  emit('change', props.value);
}
</script>

<template>
  <label :class="rootClasses" :style="rootStyles">
    <input
      class="vf-radio__input"
      type="radio"
      :checked="isChecked"
      :disabled="props.disabled"
      :value="props.value"
      :aria-invalid="props.invalid || undefined"
      v-bind="inputAttrs"
      @change="handleChange"
    />
    <span class="vf-radio__control" aria-hidden="true">
      <span class="vf-radio__dot" />
    </span>
    <span v-if="label || $slots.default" class="vf-radio__content">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>
