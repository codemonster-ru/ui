<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import VfProgressSpinner from '@/components/progress-spinner/VfProgressSpinner.vue';
import { cx } from '@/utils/classes';
import type { VfButtonVariant, VfControlSize } from '@/types/components';

defineOptions({
  inheritAttrs: false,
});

interface VfButtonProps {
  variant?: VfButtonVariant;
  size?: VfControlSize;
  block?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const props = withDefaults(defineProps<VfButtonProps>(), {
  variant: 'primary',
  size: 'md',
  block: false,
  loading: false,
  type: 'button',
});

const attrs = useAttrs();

const isDisabled = computed(() => props.loading || attrs.disabled === true || attrs.disabled === '');

const classes = computed(() =>
  cx(
    'vf-button',
    `vf-button--${props.variant}`,
    props.size !== 'md' && `vf-button--${props.size}`,
    props.block && 'vf-button--block',
    props.loading && 'vf-button--loading',
  ),
);
</script>

<template>
  <button
    v-bind="attrs"
    :class="classes"
    :type="props.type"
    :disabled="isDisabled"
    :aria-busy="props.loading ? 'true' : undefined"
  >
    <VfProgressSpinner v-if="props.loading" class="vf-button__spinner" size="var(--vf-icon-current-size)" :stroke-width="5" />
    <slot />
  </button>
</template>
