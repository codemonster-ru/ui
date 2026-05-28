<template>
  <div class="vf-skeleton" :style="rootStyle" aria-hidden="true" />
</template>

<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ name: 'VfSkeleton' });

const props = withDefaults(
  defineProps<{
    minHeight?: string | number;
    radius?: string;
    animated?: boolean;
  }>(),
  {
    minHeight: undefined,
    radius: 'var(--vf-radius-overlay)',
    animated: true,
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
  animation: props.animated ? 'vf-skeleton-shimmer 1.15s linear infinite' : 'none',
}));
</script>

<style scoped>
.vf-skeleton {
  width: 100%;
  height: 100%;
  background:
    linear-gradient(
      110deg,
      color-mix(in srgb, var(--vf-color-surface-muted) 92%, transparent) 8%,
      color-mix(in srgb, var(--vf-color-surface-muted) 82%, transparent) 18%,
      color-mix(in srgb, var(--vf-color-surface-muted) 92%, transparent) 33%
    );
  background-size: 220% 100%;
}

@keyframes vf-skeleton-shimmer {
  from {
    background-position: 100% 0;
  }

  to {
    background-position: -100% 0;
  }
}
</style>
