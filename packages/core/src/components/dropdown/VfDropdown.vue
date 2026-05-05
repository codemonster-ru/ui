<script setup lang="ts">
import { nextTick, ref, computed } from 'vue';
import { arrow, flip, offset, shift, type MiddlewareType, type PlacementType } from '@codemonster-ru/floater.js';
import { useClickOutside, useDisclosure, useEscapeKey, useFloating, useId } from '@/composables';
import { vfMotionDurationsMs } from '@/theme/motion';
import type { VfDropdownPlacement } from '@/types/components';

interface VfDropdownProps {
  open?: boolean;
  defaultOpen?: boolean;
  placement?: VfDropdownPlacement;
  teleportTo?: string | HTMLElement | null | false;
  disableTeleport?: boolean;
  closeOnSelect?: boolean;
  variant?: 'default' | 'pills';
}

const props = withDefaults(defineProps<VfDropdownProps>(), {
  open: undefined,
  defaultOpen: false,
  placement: 'bottom-start',
  teleportTo: undefined,
  disableTeleport: false,
  closeOnSelect: true,
  variant: 'default',
});

const emit = defineEmits<{
  'update:open': [value: boolean];
  openChange: [value: boolean];
}>();

const triggerRef = ref<HTMLElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const arrowRef = ref<HTMLElement | null>(null);
const menuId = useId({ prefix: 'vf-dropdown-menu' });
const triggerId = useId({ prefix: 'vf-dropdown-trigger' });
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

const menuClasses = computed(() => [
  'vf-dropdown__menu',
  `vf-dropdown__menu--${props.variant}`,
  floatingPlacement.value.startsWith('top') && 'vf-dropdown__menu--top',
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
  'vf-dropdown__arrow',
  floatingPlacement.value.startsWith('top') ? 'vf-dropdown__arrow--top' : 'vf-dropdown__arrow--bottom',
]);

const allowedPlacements = computed<PlacementType[]>(() =>
  props.placement === 'bottom-end' ? ['bottom-end', 'top-end'] : ['bottom-start', 'top-start'],
);

const {
  placement: floatingPlacement,
  middlewareData,
  styles: menuStyles,
} = useFloating(triggerRef, menuRef, {
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

function getItems() {
  return Array.from(menuRef.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
}

async function focusFirstItem() {
  await nextTick();
  getItems()[0]?.focus();
}

function openMenu(options: { focusFirstItem?: boolean } = {}) {
  disclosure.open();

  if (options.focusFirstItem) {
    void focusFirstItem();
  }
}

function closeMenu() {
  disclosure.close();
  triggerRef.value?.focus();
}

function toggleMenu() {
  if (isOpen.value) {
    closeMenu();
    return;
  }

  openMenu();
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    openMenu({ focusFirstItem: true });
  }
}

function onMenuKeydown(event: KeyboardEvent) {
  const items = getItems();
  const currentIndex = items.findIndex((item) => item === document.activeElement);

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    items[(currentIndex + 1 + items.length) % items.length]?.focus();
    return;
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault();
    items[(currentIndex - 1 + items.length) % items.length]?.focus();
    return;
  }

  if (event.key === 'Home') {
    event.preventDefault();
    items[0]?.focus();
    return;
  }

  if (event.key === 'End') {
    event.preventDefault();
    items[items.length - 1]?.focus();
  }
}

function handleItemClick() {
  if (props.closeOnSelect) {
    closeMenu();
  }
}

useClickOutside(
  [triggerRef, menuRef],
  () => {
    if (isOpen.value) {
      closeMenu();
    }
  },
  {
    enabled: isOpen,
    event: 'click',
  },
);

useEscapeKey(
  (event) => {
    if (!isOpen.value) {
      return;
    }

    event.preventDefault();
    closeMenu();
  },
  {
    enabled: isOpen,
  },
);
</script>

<template>
  <div class="vf-dropdown">
    <div
      :id="triggerId"
      ref="triggerRef"
      class="vf-dropdown__trigger"
      :aria-controls="menuId"
      :aria-expanded="isOpen"
      aria-haspopup="menu"
      tabindex="0"
      @click="toggleMenu"
      @keydown="onTriggerKeydown"
    >
      <slot name="trigger" :open="isOpen" :toggle="toggleMenu" />
    </div>

    <Teleport :to="teleportTarget" :disabled="teleportDisabled">
      <Transition name="vf-floating-transition" appear :duration="transitionDuration">
        <div
          v-if="isOpen"
          :id="menuId"
          ref="menuRef"
          :class="menuClasses"
          :style="menuStyles"
          :aria-labelledby="triggerId"
          role="menu"
          @click="handleItemClick"
          @keydown="onMenuKeydown"
        >
          <span ref="arrowRef" :class="arrowClasses" :style="arrowStyles" aria-hidden="true" />
          <slot :close="closeMenu" :open="isOpen" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
