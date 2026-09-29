<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { arrow, flip, offset, shift, type MiddlewareType, type PlacementType } from '@codemonster-ru/floater.js';
import {
  TOOLTIP_FLIP_PLACEMENTS,
  TOOLTIP_OFFSET,
  TOOLTIP_OPEN_DELAY,
  TOOLTIP_STRATEGY,
  resolveTooltipArrowClasses,
  resolveTooltipArrowOffset,
  resolveTooltipContentClasses,
  resolveTooltipDescribedBy,
  resolveTooltipHasContent,
  resolveTooltipTeleport,
} from '@codemonster-ru/vueforge-shared-core';
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
  openDelay: TOOLTIP_OPEN_DELAY,
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
  enter: vfMotionDurationsMs.normal,
  leave: vfMotionDurationsMs.normal,
} as const;
// The element case is this adapter's own: no other adapter can pass one.
const teleport = computed(() =>
  resolveTooltipTeleport(
    props.teleportTo,
    props.disableTeleport,
    (value): value is HTMLElement => typeof HTMLElement !== 'undefined' && value instanceof HTMLElement,
  ),
);

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
        offset(TOOLTIP_OFFSET),
        flip({ placements: [...TOOLTIP_FLIP_PLACEMENTS] as PlacementType[] }),
        shift(),
        ...(arrowRef.value ? [arrow(arrowRef.value)] : []),
      ] as MiddlewareType[],
  ),
  strategy: TOOLTIP_STRATEGY,
});

const classes = computed(() => resolveTooltipContentClasses(floatingPlacement.value));

const arrowData = computed(() =>
  resolveTooltipArrowOffset(
    middlewareData.value.arrow as { x?: number; y?: number; baseX?: number; baseY?: number } | undefined,
  ),
);

const arrowClasses = computed(() => resolveTooltipArrowClasses(floatingPlacement.value));

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
    <span ref="triggerRef" class="vf-tooltip__trigger" :aria-describedby="resolveTooltipDescribedBy(isOpen, tooltipId)">
      <slot />
    </span>
    <Teleport :to="teleport.target" :disabled="teleport.disabled">
      <Transition name="vf-floating-transition" appear :duration="transitionDuration">
        <span
          v-if="isOpen && resolveTooltipHasContent(text, Boolean($slots.content))"
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
