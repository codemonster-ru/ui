<template>
  <div :class="classes" :style="rootStyle" aria-hidden="true" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { resolveSkeletonClasses, resolveSkeletonStyle } from '@codemonster-ru/vueforge-shared-core';
import { cx } from '@/utils/classes';

defineOptions({ name: 'VfSkeleton' });

const props = withDefaults(
  defineProps<{
    minHeight?: string | number;
    radius?: string;
    animated?: boolean;
  }>(),
  {
    minHeight: undefined,
    radius: 'var(--vf-radius-surface)',
    animated: true,
  },
);

const classes = computed(() => cx(...resolveSkeletonClasses(props.animated)));

const rootStyle = computed(() => Object.fromEntries(resolveSkeletonStyle(props.minHeight, props.radius)));
</script>
