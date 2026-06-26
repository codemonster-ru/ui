<template>
  <div class="vf-skeleton-gate" :style="rootStyle">
    <div
      ref="contentRef"
      class="vf-skeleton-gate__content"
      :class="{
        'vf-skeleton-gate__content--ready': ready,
        'vf-skeleton-gate__content--normalize-spacing': normalizeContentSpacing,
      }"
      :style="contentStyle"
    >
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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import VfSkeleton from '@/components/skeleton/VfSkeleton.vue';

defineOptions({ name: 'VfSkeletonGate' });

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
  {
    ready: false,
    minHeight: undefined,
    reserveHeight: undefined,
    preserveLastHeight: false,
    normalizeContentSpacing: false,
    radius: undefined,
    fadeDuration: 220,
  },
);

const toCssLength = (value: string | number | undefined): string | undefined => {
  if (value == null) {
    return undefined;
  }

  return typeof value === 'number' ? `${value}px` : value;
};

const contentRef = ref<HTMLElement | null>(null);
const measuredContentHeight = ref<number | null>(null);
let resizeObserver: ResizeObserver | null = null;

const resolvedMinHeight = computed(() => {
  if (props.preserveLastHeight && measuredContentHeight.value != null && !props.ready) {
    return `${measuredContentHeight.value}px`;
  }

  const reserveHeight = toCssLength(props.reserveHeight);
  if (reserveHeight != null) {
    return reserveHeight;
  }

  return toCssLength(props.minHeight);
});

const rootStyle = computed(() => ({
  minHeight: resolvedMinHeight.value,
  borderRadius: props.radius,
  '--vf-skeleton-gate-fade-duration': `${props.fadeDuration}ms`,
}));

const contentStyle = computed(() => ({}));

const overlayStyle = computed(() => ({
  borderRadius: props.radius,
}));

const syncMeasuredHeight = () => {
  const height = contentRef.value?.offsetHeight;
  if (height && height > 0) {
    measuredContentHeight.value = height;
  }
};

onMounted(() => {
  syncMeasuredHeight();

  if (typeof ResizeObserver === 'undefined' || !contentRef.value) {
    return;
  }

  resizeObserver = new ResizeObserver(() => {
    syncMeasuredHeight();
  });
  resizeObserver.observe(contentRef.value);
});

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});
</script>
