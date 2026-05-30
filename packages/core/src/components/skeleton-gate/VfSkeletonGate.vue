<template>
  <div class="vf-skeleton-gate" :style="rootStyle">
    <div class="vf-skeleton-gate__content" :class="{ 'vf-skeleton-gate__content--ready': ready }" :style="contentStyle">
      <slot />
    </div>

    <div v-show="!ready" class="vf-skeleton-gate__overlay" :style="overlayStyle" aria-hidden="true">
      <slot name="skeleton">
        <!-- Default skeleton primitive used by the gate when no custom skeleton slot is provided. -->
        <VfSkeleton :min-height="minHeight" :radius="radius" />
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VfSkeleton from '@/components/skeleton/VfSkeleton.vue';

defineOptions({ name: 'VfSkeletonGate' });

const props = withDefaults(
  defineProps<{
    ready?: boolean;
    minHeight?: string | number;
    radius?: string;
    fadeDuration?: number;
  }>(),
  {
    ready: false,
    minHeight: undefined,
    radius: 'var(--vf-radius-overlay)',
    fadeDuration: 220,
  }
);

const toCssLength = (value: string | number | undefined): string | undefined => {
  if (value == null) {
    return undefined;
  }

  return typeof value === 'number' ? `${value}px` : value;
};

const rootStyle = computed(() => ({
  minHeight: toCssLength(props.minHeight),
  borderRadius: props.radius,
  overflow: 'hidden'
}));

const contentStyle = computed(() => ({
  transition: `opacity ${props.fadeDuration}ms ease`
}));

const overlayStyle = computed(() => ({
  borderRadius: props.radius,
  transition: `opacity ${props.fadeDuration}ms ease`
}));
</script>
