<template>
  <div class="vf-skeleton" :class="{ 'vf-skeleton--animated': props.animated }" :style="rootStyle" aria-hidden="true" />
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
}));
</script>
