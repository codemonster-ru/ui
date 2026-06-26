<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type CSSProperties } from 'vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';

interface VfHorizontalScrollerProps {
  leftAriaLabel?: string;
  rightAriaLabel?: string;
  stepRatio?: number;
  minStep?: number;
  viewportClass?: string;
  leftControlClass?: string;
  rightControlClass?: string;
  hiddenControlClass?: string;
  canScrollLeftClass?: string;
  canScrollRightClass?: string;
  controlsReadyClass?: string;
  controlsAnimatedClass?: string;
}

const props = withDefaults(defineProps<VfHorizontalScrollerProps>(), {
  leftAriaLabel: 'Scroll left',
  rightAriaLabel: 'Scroll right',
  stepRatio: 0.6,
  minStep: 120,
  viewportClass: '',
  leftControlClass: '',
  rightControlClass: '',
  hiddenControlClass: '',
  canScrollLeftClass: '',
  canScrollRightClass: '',
  controlsReadyClass: '',
  controlsAnimatedClass: '',
});

const emit = defineEmits<{
  'viewport-change': [element: HTMLElement | null];
  'state-change': [
    payload: {
      canScrollLeft: boolean;
      canScrollRight: boolean;
      controlsReady: boolean;
      controlsAnimated: boolean;
      isScrolling: boolean;
    },
  ];
}>();

const viewportRef = ref<HTMLElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);
const controlsReady = ref(false);
const controlsAnimated = ref(false);
const isScrolling = ref(false);
let resizeObserver: ResizeObserver | null = null;
let scrollStopTimeout: ReturnType<typeof setTimeout> | null = null;

const rootClasses = computed(() => ({
  'vf-horizontal-scroller--controls-ready': controlsReady.value,
  'vf-horizontal-scroller--controls-animated': controlsAnimated.value,
  'vf-horizontal-scroller--can-scroll-left': canScrollLeft.value,
  'vf-horizontal-scroller--can-scroll-right': canScrollRight.value,
  [props.canScrollLeftClass]: Boolean(props.canScrollLeftClass) && canScrollLeft.value,
  [props.canScrollRightClass]: Boolean(props.canScrollRightClass) && canScrollRight.value,
  [props.controlsReadyClass]: Boolean(props.controlsReadyClass) && controlsReady.value,
  [props.controlsAnimatedClass]: Boolean(props.controlsAnimatedClass) && controlsAnimated.value,
}));

const viewportStyle = computed<CSSProperties>(
  () =>
    ({
      '--vf-horizontal-scroller-scrollbar-width': isScrolling.value ? 'thin' : 'none',
    }) as CSSProperties,
);

function updateScrollState() {
  const viewport = viewportRef.value;

  if (!viewport) {
    canScrollLeft.value = false;
    canScrollRight.value = false;
    return;
  }

  const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
  canScrollLeft.value = viewport.scrollLeft > 1;
  canScrollRight.value = maxScrollLeft - viewport.scrollLeft > 1;
  emitState();
}

function emitState() {
  emit('state-change', {
    canScrollLeft: canScrollLeft.value,
    canScrollRight: canScrollRight.value,
    controlsReady: controlsReady.value,
    controlsAnimated: controlsAnimated.value,
    isScrolling: isScrolling.value,
  });
}

function handleScroll() {
  isScrolling.value = true;
  if (scrollStopTimeout) {
    clearTimeout(scrollStopTimeout);
  }
  scrollStopTimeout = setTimeout(() => {
    isScrolling.value = false;
    emitState();
  }, 140);

  updateScrollState();
}

function handleWindowResize() {
  updateScrollState();
}

function scrollBy(direction: 'left' | 'right') {
  const viewport = viewportRef.value;

  if (!viewport) {
    return;
  }

  const delta = Math.max(props.minStep, Math.round(viewport.clientWidth * props.stepRatio));
  const nextScrollLeft = direction === 'left' ? viewport.scrollLeft - delta : viewport.scrollLeft + delta;

  viewport.scrollTo({
    left: nextScrollLeft,
    behavior: 'smooth',
  });
}

onMounted(() => {
  emit('viewport-change', viewportRef.value);
  requestAnimationFrame(() => {
    controlsReady.value = true;
    updateScrollState();
    emitState();
    requestAnimationFrame(() => {
      controlsAnimated.value = true;
      emitState();
    });
  });

  if (typeof ResizeObserver !== 'undefined' && viewportRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });
    resizeObserver.observe(viewportRef.value);
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleWindowResize);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  if (scrollStopTimeout) {
    clearTimeout(scrollStopTimeout);
  }

  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleWindowResize);
  }
  emit('viewport-change', null);
});
</script>

<template>
  <div class="vf-horizontal-scroller" :class="rootClasses">
    <button
      :class="[
        'vf-horizontal-scroller__control',
        'vf-horizontal-scroller__control--left',
        leftControlClass,
        { 'vf-horizontal-scroller__control--hidden': !controlsReady || !canScrollLeft },
        { [hiddenControlClass]: Boolean(hiddenControlClass) && (!controlsReady || !canScrollLeft) },
      ]"
      type="button"
      :aria-label="leftAriaLabel"
      :aria-hidden="!controlsReady || !canScrollLeft"
      :tabindex="controlsReady && canScrollLeft ? 0 : -1"
      :disabled="!controlsReady || !canScrollLeft"
      @click="scrollBy('left')"
    >
      <VueIconify :icon="icons.chevronLeft" aria-hidden="true" size="1.25em" />
    </button>

    <div
      ref="viewportRef"
      :class="['vf-horizontal-scroller__viewport', viewportClass]"
      :style="viewportStyle"
      @scroll="handleScroll"
    >
      <slot />
    </div>

    <div
      v-if="controlsAnimated && canScrollLeft"
      class="vf-horizontal-scroller__fade vf-horizontal-scroller__fade--left"
      aria-hidden="true"
    />

    <div
      v-if="controlsAnimated && canScrollRight"
      class="vf-horizontal-scroller__fade vf-horizontal-scroller__fade--right"
      aria-hidden="true"
    />

    <button
      :class="[
        'vf-horizontal-scroller__control',
        'vf-horizontal-scroller__control--right',
        rightControlClass,
        { 'vf-horizontal-scroller__control--hidden': !controlsReady || !canScrollRight },
        { [hiddenControlClass]: Boolean(hiddenControlClass) && (!controlsReady || !canScrollRight) },
      ]"
      type="button"
      :aria-label="rightAriaLabel"
      :aria-hidden="!controlsReady || !canScrollRight"
      :tabindex="controlsReady && canScrollRight ? 0 : -1"
      :disabled="!controlsReady || !canScrollRight"
      @click="scrollBy('right')"
    >
      <VueIconify :icon="icons.chevronRight" aria-hidden="true" size="1.25em" />
    </button>

    <slot name="overlay" />
  </div>
</template>
