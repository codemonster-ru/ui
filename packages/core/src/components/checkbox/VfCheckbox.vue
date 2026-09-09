<script setup lang="ts">
import { computed, onMounted, ref, useAttrs, watch, type StyleValue } from 'vue';
import { resolveCheckboxAriaChecked, resolveCheckboxClasses } from '@codemonster-ru/vueforge-shared-core';
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
  indeterminate?: boolean;
  label?: string;
}

const props = withDefaults(defineProps<VfCheckboxProps>(), {
  modelValue: false,
  size: 'md',
  invalid: false,
  disabled: false,
  indeterminate: false,
  label: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  change: [value: boolean];
}>();

const attrs = useAttrs();
const input = ref<HTMLInputElement>();

function syncIndeterminate() {
  if (input.value) {
    input.value.indeterminate = props.indeterminate;
  }
}

watch(() => props.indeterminate, syncIndeterminate);
onMounted(syncIndeterminate);

const rootClasses = computed(() =>
  cx(
    ...resolveCheckboxClasses({
      size: props.size,
      checked: props.modelValue,
      indeterminate: props.indeterminate,
      invalid: props.invalid,
      disabled: props.disabled,
    }),
    attrs.class as string | undefined,
  ),
);
const ariaChecked = computed(() =>
  resolveCheckboxAriaChecked({ checked: props.modelValue, indeterminate: props.indeterminate }),
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
      ref="input"
      class="vf-checkbox__input"
      type="checkbox"
      :checked="props.modelValue"
      :disabled="props.disabled"
      :aria-invalid="props.invalid || undefined"
      :aria-checked="ariaChecked"
      v-bind="inputAttrs"
      @change="handleChange"
    />
    <span class="vf-checkbox__control" aria-hidden="true">
      <span v-if="props.indeterminate" class="vf-checkbox__indeterminate-mark" />
      <span v-else class="vf-checkbox__mark" />
    </span>
    <span v-if="label || $slots.default" class="vf-checkbox__content">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>
