<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { arrow, flip, offset, shift, type MiddlewareType, type PlacementType } from '@codemonster-ru/floater.js';
import {
  POPOVER_AUTOFOCUS_SELECTOR,
  POPOVER_OFFSET,
  POPOVER_STRATEGY,
  resolvePopoverArrowClasses,
  resolvePopoverArrowOffset,
  resolvePopoverClosesOnEscape,
  resolvePopoverClosesOnOutsideClick,
  resolvePopoverContentClasses,
  resolvePopoverFlipPlacements,
  resolvePopoverTeleport,
  resolvePopoverTriggerKey,
  resolvePopoverTriggerState,
} from '@codemonster-ru/vueforge-shared-core';
import { useClickOutside, useDisclosure, useEscapeKey, useFloating, useId } from '@/composables';
import { useFocusScopeBranch } from '@/composables/useFocusTrap';
import { vfMotionDurationsMs } from '@/theme/motion';
import type { VfDropdownPlacement } from '@/types/components';

interface VfPopoverProps {
  open?: boolean;
  defaultOpen?: boolean;
  placement?: VfDropdownPlacement;
  teleportTo?: string | HTMLElement | null | false;
  disableTeleport?: boolean;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
}

const props = withDefaults(defineProps<VfPopoverProps>(), {
  open: undefined,
  defaultOpen: false,
  placement: 'bottom-start',
  teleportTo: undefined,
  disableTeleport: false,
  closeOnOutsideClick: true,
  closeOnEscape: true,
});

const emit = defineEmits<{
  'update:open': [value: boolean];
  openChange: [value: boolean];
}>();

const triggerRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const arrowRef = ref<HTMLElement | null>(null);
const contentId = useId({ prefix: 'vf-popover-content' });
const triggerId = useId({ prefix: 'vf-popover-trigger' });
const transitionDuration = {
  enter: vfMotionDurationsMs.normal,
  leave: vfMotionDurationsMs.normal,
} as const;
// The element case is this adapter's own: no other adapter can pass one.
const teleport = computed(() =>
  resolvePopoverTeleport(
    props.teleportTo,
    props.disableTeleport,
    (value): value is HTMLElement => typeof HTMLElement !== 'undefined' && value instanceof HTMLElement,
  ),
);

const disclosure = useDisclosure({
  defaultOpen: props.defaultOpen,
  open: computed(() => props.open),
  onOpenChange: (value) => {
    emit('update:open', value);
    emit('openChange', value);
  },
});

const isOpen = disclosure.isOpen;
const triggerState = computed(() => resolvePopoverTriggerState(isOpen.value));

useFocusScopeBranch(contentRef, isOpen);

const allowedPlacements = computed(() => resolvePopoverFlipPlacements(props.placement) as PlacementType[]);

const {
  placement: floatingPlacement,
  middlewareData,
  styles: contentStyles,
} = useFloating(triggerRef, contentRef, {
  enabled: isOpen,
  placement: computed(() => props.placement),
  middleware: computed(
    () =>
      [
        offset(POPOVER_OFFSET),
        flip({ placements: allowedPlacements.value }),
        shift(),
        ...(arrowRef.value ? [arrow(arrowRef.value)] : []),
      ] as MiddlewareType[],
  ),
  strategy: POPOVER_STRATEGY,
});

const contentClasses = computed(() => resolvePopoverContentClasses(floatingPlacement.value));

const arrowData = computed(() =>
  resolvePopoverArrowOffset(
    middlewareData.value.arrow as { x?: number; y?: number; baseX?: number; baseY?: number } | undefined,
  ),
);

const arrowStyles = computed(() => ({
  left: `${arrowData.value.x}px`,
  top: `${arrowData.value.y}px`,
}));

const arrowClasses = computed(() => resolvePopoverArrowClasses(floatingPlacement.value));

async function focusContent() {
  await nextTick();

  const autoFocusTarget = contentRef.value?.querySelector<HTMLElement>(POPOVER_AUTOFOCUS_SELECTOR);

  if (autoFocusTarget) {
    autoFocusTarget.focus();
    return;
  }

  contentRef.value?.focus();
}

function openPopover() {
  disclosure.open();
  void focusContent();
}

function closePopover() {
  disclosure.close();
  triggerRef.value?.focus();
}

function togglePopover() {
  if (isOpen.value) {
    closePopover();
    return;
  }

  openPopover();
}

function onTriggerKeydown(event: KeyboardEvent) {
  const action = resolvePopoverTriggerKey(event.key);

  if (action === 'toggle') {
    event.preventDefault();
    togglePopover();
  }

  if (action === 'open') {
    event.preventDefault();
    openPopover();
  }
}

useClickOutside(
  [triggerRef, contentRef],
  () => {
    if (resolvePopoverClosesOnOutsideClick(isOpen.value, props.closeOnOutsideClick)) {
      closePopover();
    }
  },
  {
    enabled: isOpen,
    event: 'click',
  },
);

useEscapeKey(
  (event) => {
    if (!resolvePopoverClosesOnEscape(isOpen.value, props.closeOnEscape)) {
      return;
    }

    event.preventDefault();
    closePopover();
  },
  {
    enabled: isOpen,
  },
);
</script>

<template>
  <div class="vf-popover">
    <div
      :id="triggerId"
      ref="triggerRef"
      class="vf-popover__trigger"
      :aria-controls="contentId"
      :aria-expanded="triggerState.ariaExpanded"
      aria-haspopup="dialog"
      tabindex="0"
      @click="togglePopover"
      @keydown="onTriggerKeydown"
    >
      <slot name="trigger" :open="isOpen" :toggle="togglePopover" />
    </div>

    <Teleport :to="teleport.target" :disabled="teleport.disabled">
      <Transition name="vf-floating-transition" appear :duration="transitionDuration">
        <section
          v-if="isOpen"
          :id="contentId"
          ref="contentRef"
          :class="contentClasses"
          :style="contentStyles"
          :aria-labelledby="triggerId"
          role="dialog"
          tabindex="-1"
        >
          <span ref="arrowRef" :class="arrowClasses" :style="arrowStyles" aria-hidden="true" />
          <slot :open="isOpen" :close="closePopover" />
        </section>
      </Transition>
    </Teleport>
  </div>
</template>
