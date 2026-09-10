<template>
  <div class="vf-skeleton-gate" :style="rootStyle" :aria-busy="!ready || undefined">
    <div
      ref="contentRef"
      :class="contentClasses"
      :style="contentStyle"
      :aria-hidden="!ready || undefined"
      :inert="!ready ? true : undefined"
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
import {
  resolveSkeletonGateContentClasses,
  resolveSkeletonGateMinHeight,
  resolveSkeletonGateOverlayStyle,
  resolveSkeletonGateRootStyle,
} from '@codemonster-ru/vueforge-shared-core';
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

const contentRef = ref<HTMLElement | null>(null);
const measuredContentHeight = ref<number | null>(null);
let resizeObserver: ResizeObserver | null = null;

const resolvedMinHeight = computed(() =>
  resolveSkeletonGateMinHeight(
    props.ready,
    props.minHeight,
    props.reserveHeight,
    props.preserveLastHeight,
    measuredContentHeight.value,
  ),
);

// Object.fromEntries over the shared declarations, which is how every migrated
// component reaches its style attribute. The rules keep an empty value as an
// empty value rather than dropping it, so the object handed to Vue here is the
// same object the reference built and both serialisers behave as they always
// did: the client drops the property, SSR writes `min-height:;`.
const rootStyle = computed(() =>
  Object.fromEntries(resolveSkeletonGateRootStyle(resolvedMinHeight.value, props.radius, props.fadeDuration)),
);

// A computed that always returns an empty object, exactly as the reference
// wrote it. It renders no attribute on the client and `style=""` under SSR.
// Removing the binding would be an obvious tidy-up and would change the server
// output of every gate.
const contentStyle = computed(() => ({}));

const contentClasses = computed(() =>
  resolveSkeletonGateContentClasses(props.ready, props.normalizeContentSpacing),
);

const overlayStyle = computed(() => Object.fromEntries(resolveSkeletonGateOverlayStyle(props.radius)));

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
