<script setup lang="ts">
import { Comment, Fragment, Text, computed, useAttrs, useSlots, type StyleValue, type VNode } from 'vue';
import { cx } from '@/utils/classes';
import type { VfControlSize, VfSwitchThumbContrast } from '@/types/components';

defineOptions({
  inheritAttrs: false,
});

interface VfSwitchProps {
  modelValue?: boolean;
  size?: VfControlSize;
  static?: boolean;
  thumbContrast?: VfSwitchThumbContrast;
  invalid?: boolean;
  disabled?: boolean;
  label?: string;
}

const props = withDefaults(defineProps<VfSwitchProps>(), {
  modelValue: false,
  size: 'md',
  static: false,
  thumbContrast: 'auto',
  invalid: false,
  disabled: false,
  label: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  change: [value: boolean];
}>();

const attrs = useAttrs();
const slots = useSlots();

const rootClasses = computed(() =>
  cx(
    'vf-switch',
    `vf-switch--${props.size}`,
    props.static && 'vf-switch--static',
    props.thumbContrast !== 'auto' && `vf-switch--thumb-contrast-${props.thumbContrast}`,
    props.modelValue && 'vf-switch--checked',
    props.invalid && 'vf-switch--invalid',
    props.disabled && 'vf-switch--disabled',
    attrs.class as string | undefined,
  ),
);

const rootStyles = computed<StyleValue>(() => attrs.style as StyleValue);
const hasContent = computed(() => {
  if (props.label) {
    return true;
  }

  const nodes: VNode[] = slots.default?.({}) ?? [];

  function hasRenderableNode(node: VNode): boolean {
    if (node.type === Comment) {
      return false;
    }

    if (node.type === Text) {
      return String(node.children ?? '').trim().length > 0;
    }

    if (node.type === Fragment && Array.isArray(node.children)) {
      return node.children.some((child) => hasRenderableNode(child as VNode));
    }

    return true;
  }

  return nodes.some((node: VNode) => hasRenderableNode(node));
});
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
      class="vf-switch__input"
      type="checkbox"
      role="switch"
      :checked="props.modelValue"
      :disabled="props.disabled"
      :aria-invalid="props.invalid || undefined"
      v-bind="inputAttrs"
      @change="handleChange"
    />
    <span class="vf-switch__control" aria-hidden="true">
      <span class="vf-switch__thumb">
        <slot name="thumb" :checked="props.modelValue" />
      </span>
    </span>
    <span v-if="hasContent" class="vf-switch__content">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>
