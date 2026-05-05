<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { arrow, flip, offset, shift, type MiddlewareType, type PlacementType } from '@codemonster-ru/floater.js';
import { useClickOutside, useDisclosure, useEscapeKey, useFloating, useId } from '@/composables';
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

const disclosure = useDisclosure({
  defaultOpen: props.defaultOpen,
  open: computed(() => props.open),
  onOpenChange: (value) => {
    emit('update:open', value);
    emit('openChange', value);
  },
});

const isOpen = disclosure.isOpen;

const allowedPlacements = computed<PlacementType[]>(() =>
  props.placement === 'bottom-end' ? ['bottom-end', 'top-end'] : ['bottom-start', 'top-start'],
);

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
        offset(10),
        flip({ placements: allowedPlacements.value }),
        shift(),
        ...(arrowRef.value ? [arrow(arrowRef.value)] : []),
      ] as MiddlewareType[],
  ),
  strategy: 'fixed',
});

const contentClasses = computed(() => [
  'vf-popover__content',
  floatingPlacement.value.startsWith('top') && 'vf-popover__content--top',
]);

const arrowData = computed(() => {
  const data = middlewareData.value.arrow as { x?: number; y?: number; baseX?: number; baseY?: number } | undefined;

  return {
    x: data?.x !== undefined && data?.baseX !== undefined ? data.x - data.baseX : 0,
    y: data?.y !== undefined && data?.baseY !== undefined ? data.y - data.baseY : 0,
  };
});

const arrowStyles = computed(() => ({
  left: `${arrowData.value.x}px`,
  top: `${arrowData.value.y}px`,
}));

const arrowClasses = computed(() => [
  'vf-popover__arrow',
  floatingPlacement.value.startsWith('top') ? 'vf-popover__arrow--top' : 'vf-popover__arrow--bottom',
]);

async function focusContent() {
  await nextTick();

  const autoFocusTarget = contentRef.value?.querySelector<HTMLElement>('[autofocus], [data-autofocus]');

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
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    togglePopover();
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    openPopover();
  }
}

useClickOutside(
  [triggerRef, contentRef],
  () => {
    if (isOpen.value && props.closeOnOutsideClick) {
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
    if (!isOpen.value || !props.closeOnEscape) {
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
      :aria-expanded="isOpen"
      aria-haspopup="dialog"
      tabindex="0"
      @click="togglePopover"
      @keydown="onTriggerKeydown"
    >
      <slot name="trigger" :open="isOpen" :toggle="togglePopover" />
    </div>

    <Teleport :to="teleportTarget" :disabled="teleportDisabled">
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
