<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { arrow, flip, offset, shift, type MiddlewareType } from '@codemonster-ru/floater.js';
import { useFloating, useId } from '@/composables';
import { vfMotionDurationsMs } from '@/theme/motion';
import type { VfTooltipPlacement } from '@/types/components';

interface VfTooltipProps {
  text?: string;
  placement?: VfTooltipPlacement;
  openDelay?: number;
  teleportTo?: string | HTMLElement | null | false;
  disableTeleport?: boolean;
}

const props = withDefaults(defineProps<VfTooltipProps>(), {
  text: undefined,
  placement: 'top',
  openDelay: 80,
  teleportTo: undefined,
  disableTeleport: false,
});

const isOpen = ref(false);
const tooltipId = useId({ prefix: 'vf-tooltip' });
const openTimeout = ref<number | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const arrowRef = ref<HTMLElement | null>(null);
const transitionDuration = {
  enter: vfMotionDurationsMs.fast,
  leave: vfMotionDurationsMs.fast,
} as const;
const teleportDisabled = computed(
  () => props.disableTeleport || props.teleportTo === false || props.teleportTo === null,
);
const teleportTarget = computed(() => {
  if (typeof props.teleportTo === 'string') {
    return props.teleportTo;
  }

  if (typeof HTMLElement !== 'undefined' && props.teleportTo instanceof HTMLElement) {
    return props.teleportTo;
  }

  return 'body';
});

const {
  placement: floatingPlacement,
  middlewareData,
  styles: tooltipStyles,
  cleanup: cleanupFloating,
} = useFloating(triggerRef, contentRef, {
  enabled: isOpen,
  placement: computed(() => props.placement),
  middleware: computed(
    () =>
      [
        offset(10),
        flip({ placements: ['top', 'bottom'] }),
        shift(),
        ...(arrowRef.value ? [arrow(arrowRef.value)] : []),
      ] as MiddlewareType[],
  ),
  strategy: 'fixed',
});

const classes = computed(() => [
  'vf-tooltip__content',
  floatingPlacement.value.startsWith('bottom') && 'vf-tooltip__content--bottom',
  floatingPlacement.value.startsWith('top') && 'vf-tooltip__content--top',
]);

const arrowData = computed(() => {
  const data = middlewareData.value.arrow as { x?: number; y?: number; baseX?: number; baseY?: number } | undefined;

  return {
    x: data?.x !== undefined && data?.baseX !== undefined ? data.x - data.baseX : 0,
    y: data?.y !== undefined && data?.baseY !== undefined ? data.y - data.baseY : 0,
  };
});

const arrowClasses = computed(() => [
  'vf-tooltip__arrow',
  floatingPlacement.value.startsWith('bottom') && 'vf-tooltip__arrow--bottom',
  floatingPlacement.value.startsWith('top') && 'vf-tooltip__arrow--top',
]);

const arrowStyles = computed(() => ({
  left: `${arrowData.value.x}px`,
  top: `${arrowData.value.y}px`,
}));

function clearTimer() {
  if (openTimeout.value !== null) {
    window.clearTimeout(openTimeout.value);
    openTimeout.value = null;
  }
}

function open() {
  clearTimer();
  openTimeout.value = window.setTimeout(() => {
    isOpen.value = true;
  }, props.openDelay);
}

function close() {
  clearTimer();
  isOpen.value = false;
}

onBeforeUnmount(() => {
  clearTimer();
  cleanupFloating();
});
</script>

<template>
  <span class="vf-tooltip" @mouseenter="open" @mouseleave="close" @focusin="open" @focusout="close">
    <span ref="triggerRef" class="vf-tooltip__trigger" :aria-describedby="isOpen ? tooltipId : undefined">
      <slot />
    </span>
    <Teleport :to="teleportTarget" :disabled="teleportDisabled">
      <Transition name="vf-floating-transition" appear :duration="transitionDuration">
        <span
          v-if="isOpen && (text || $slots.content)"
          :id="tooltipId"
          ref="contentRef"
          :class="classes"
          :style="tooltipStyles"
          role="tooltip"
        >
          <slot name="content">
            {{ text }}
          </slot>
          <span ref="arrowRef" :class="arrowClasses" :style="arrowStyles" aria-hidden="true" />
        </span>
      </Transition>
    </Teleport>
  </span>
</template>
