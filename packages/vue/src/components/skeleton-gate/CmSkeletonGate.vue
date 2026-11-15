<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import CmSkeleton from '../skeleton/CmSkeleton.vue';

const props = withDefaults(
  defineProps<{
    ready?: boolean;
    minHeight?: string | number;
    reserveHeight?: string | number;
    preserveLastHeight?: boolean;
    normalizeContentSpacing?: boolean;
    radius?: string;
    fadeDuration?: number;
  }>(),
  { minHeight: undefined, reserveHeight: undefined, radius: undefined, fadeDuration: 220 },
);

const content = ref<HTMLElement>();
const lastHeight = ref<number>();
let observer: ResizeObserver | undefined;

const minHeight = computed(() => {
  const value =
    props.preserveLastHeight && !props.ready && lastHeight.value !== undefined
      ? lastHeight.value
      : (props.reserveHeight ?? props.minHeight);
  return typeof value === 'number' ? `${value}px` : value;
});
const style = computed(() => ({
  minHeight: minHeight.value,
  borderRadius: props.radius,
  '--cm-skeleton-gate-fade-duration': `${props.fadeDuration}ms`,
}));
const placeholderStyle = computed(() => ({
  minHeight: typeof props.minHeight === 'number' ? `${props.minHeight}px` : props.minHeight,
  borderRadius: props.radius,
}));

function measure(): void {
  const height = content.value?.offsetHeight;
  if (height && height > 0) lastHeight.value = height;
}

onMounted(() => {
  measure();
  if (content.value && typeof ResizeObserver === 'function') {
    observer = new ResizeObserver(measure);
    observer.observe(content.value);
  }
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <div class="cm-skeleton-gate" :style="style" :aria-busy="!props.ready || undefined">
    <div
      ref="content"
      class="cm-skeleton-gate__content"
      :class="{
        'cm-skeleton-gate__content--ready': props.ready,
        'cm-skeleton-gate__content--normalize-spacing': props.normalizeContentSpacing,
      }"
      :aria-hidden="!props.ready || undefined"
      :inert="!props.ready || undefined"
    >
      <slot />
    </div>
    <div
      :hidden="props.ready || undefined"
      class="cm-skeleton-gate__overlay"
      v-bind="props.radius ? { style: { borderRadius: props.radius } } : undefined"
      aria-hidden="true"
    >
      <slot name="skeleton">
        <CmSkeleton :style="placeholderStyle" />
      </slot>
    </div>
  </div>
</template>
