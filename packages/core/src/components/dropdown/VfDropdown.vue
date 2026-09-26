<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { arrow, flip, offset, shift, type MiddlewareType, type PlacementType } from '@codemonster-ru/floater.js';
import {
  DROPDOWN_OFFSET,
  DROPDOWN_STRATEGY,
  DROPDOWN_TRIGGER_OPEN_KEYS,
  resolveDropdownArrowClasses,
  resolveDropdownArrowOffset,
  resolveDropdownFlipPlacements,
  resolveDropdownMenuClasses,
  resolveDropdownMenuNavigation,
  resolveDropdownOpen,
  resolveDropdownTeleport,
  resolveDropdownTriggerState,
} from '@codemonster-ru/vueforge-shared-core';
import { useClickOutside, useDisclosure, useEscapeKey, useFloating, useId } from '@/composables';
import { useFocusScopeBranch } from '@/composables/useFocusTrap';
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
  disabled?: boolean;
}

const props = withDefaults(defineProps<VfDropdownProps>(), {
  open: undefined,
  defaultOpen: false,
  placement: 'bottom-start',
  teleportTo: undefined,
  disableTeleport: false,
  closeOnSelect: true,
  variant: 'default',
  disabled: false,
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
  enter: vfMotionDurationsMs.normal,
  leave: vfMotionDurationsMs.normal,
} as const;
// The element case is this adapter's own: no other adapter can pass one.
const teleport = computed(() =>
  resolveDropdownTeleport(
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

const disclosureOpen = disclosure.isOpen;
const isOpen = computed(() => resolveDropdownOpen(props.disabled, disclosureOpen.value));
const triggerState = computed(() => resolveDropdownTriggerState(props.disabled, disclosureOpen.value));

useFocusScopeBranch(menuRef, isOpen);

const menuClasses = computed(() => resolveDropdownMenuClasses(props.variant, floatingPlacement.value));

const arrowData = computed(() =>
  resolveDropdownArrowOffset(
    middlewareData.value.arrow as { x?: number; y?: number; baseX?: number; baseY?: number } | undefined,
  ),
);

const arrowStyles = computed(() => ({
  left: `${arrowData.value.x}px`,
  top: `${arrowData.value.y}px`,
}));

const arrowClasses = computed(() => resolveDropdownArrowClasses(floatingPlacement.value));

const allowedPlacements = computed(() => resolveDropdownFlipPlacements(props.placement) as PlacementType[]);

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
        offset(DROPDOWN_OFFSET),
        flip({ placements: allowedPlacements.value }),
        shift(),
        ...(arrowRef.value ? [arrow(arrowRef.value)] : []),
      ] as MiddlewareType[],
  ),
  strategy: DROPDOWN_STRATEGY,
});

function getItems() {
  return Array.from(menuRef.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
}

async function focusFirstItem() {
  await nextTick();
  getItems()[0]?.focus();
}

function openMenu(options: { focusFirstItem?: boolean } = {}) {
  if (props.disabled) {
    return;
  }

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
  if (props.disabled) {
    return;
  }

  if (isOpen.value) {
    closeMenu();
    return;
  }

  openMenu();
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (props.disabled) {
    return;
  }

  if (DROPDOWN_TRIGGER_OPEN_KEYS.includes(event.key)) {
    event.preventDefault();
    openMenu({ focusFirstItem: true });
  }
}

function onMenuKeydown(event: KeyboardEvent) {
  const items = getItems();
  const currentIndex = items.findIndex((item) => item === document.activeElement);
  const target = resolveDropdownMenuNavigation(event.key, currentIndex, items.length);

  if (target === undefined) {
    return;
  }

  event.preventDefault();
  items[target]?.focus();
}

function handleItemClick() {
  if (props.closeOnSelect) {
    closeMenu();
  }
}

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled && disclosureOpen.value) {
      disclosure.close();
    }
  },
  { immediate: true },
);

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
      :aria-disabled="triggerState.ariaDisabled"
      :aria-expanded="triggerState.ariaExpanded"
      aria-haspopup="menu"
      :tabindex="triggerState.tabindex"
      @click="toggleMenu"
      @keydown="onTriggerKeydown"
    >
      <slot name="trigger" :open="isOpen" :toggle="toggleMenu" :disabled="props.disabled" />
    </div>

    <Teleport :to="teleport.target" :disabled="teleport.disabled">
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
