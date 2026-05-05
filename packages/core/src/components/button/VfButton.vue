<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { cx } from '@/utils/classes';
import type { VfButtonVariant, VfControlSize } from '@/types/components';

defineOptions({
  inheritAttrs: false,
});

interface VfButtonProps {
  variant?: VfButtonVariant;
  size?: VfControlSize;
  block?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const props = withDefaults(defineProps<VfButtonProps>(), {
  variant: 'primary',
  size: 'md',
  block: false,
  type: 'button',
});

const attrs = useAttrs();

const classes = computed(() =>
  cx(
    'vf-button',
    `vf-button--${props.variant}`,
    props.size !== 'md' && `vf-button--${props.size}`,
    props.block && 'vf-button--block',
  ),
);
</script>

<template>
  <button :class="classes" :type="props.type" v-bind="attrs">
    <slot />
  </button>
</template>
