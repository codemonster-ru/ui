<script setup lang="ts">
import CmSkeleton from './CmSkeleton.vue';
import type { VfSkeletonProps } from './skeleton.types';

const props = withDefaults(defineProps<VfSkeletonProps>(), { animated: true, minHeight: undefined, radius: undefined });

function cssValue(value: string | number | undefined): string | undefined {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? `${value}px` : undefined;
  return value && !/[;{}]/u.test(value) ? value : undefined;
}
</script>

<template>
  <CmSkeleton
    :animated="props.animated"
    :style="{ minHeight: cssValue(props.minHeight), borderRadius: cssValue(props.radius) }"
  />
</template>
