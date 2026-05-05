<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { VueIconify, type IconName } from '@codemonster-ru/vueforge-icons';
import { cx } from '@/utils/classes';
import type { VfButtonVariant, VfControlSize } from '@/types/components';

defineOptions({
  inheritAttrs: false,
});

interface VfIconButtonProps {
  icon: IconName | string;
  variant?: VfButtonVariant;
  size?: VfControlSize;
  type?: 'button' | 'submit' | 'reset';
}

const props = withDefaults(defineProps<VfIconButtonProps>(), {
  variant: 'ghost',
  size: 'md',
  type: 'button',
});

const attrs = useAttrs();

const classes = computed(() =>
  cx('vf-icon-button', `vf-icon-button--${props.variant}`, props.size !== 'md' && `vf-icon-button--${props.size}`),
);

const iconSize = computed(() => {
  if (props.size === 'sm') {
    return 'var(--vf-icon-size-sm)';
  }

  if (props.size === 'lg') {
    return 'var(--vf-icon-size-lg)';
  }

  return 'var(--vf-icon-size-md)';
});
</script>

<template>
  <button :class="classes" :type="props.type" v-bind="attrs">
    <VueIconify :icon="props.icon" :size="iconSize" aria-hidden="true" />
  </button>
</template>
