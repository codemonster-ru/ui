<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import VfMenuBarItemNode from './VfMenuBarItemNode.vue';
import VfHorizontalScroller from '@/components/internal/VfHorizontalScroller.vue';
import { useClickOutside, useEscapeKey } from '@/composables';
import type { VfNavMenuItem } from '@/types/components';

interface VfMenuBarProps {
  items: VfNavMenuItem[];
  modelValue?: string;
  defaultValue?: string;
  ariaLabel?: string;
  variant?: 'default' | 'pills';
}

const props = withDefaults(defineProps<VfMenuBarProps>(), {
  modelValue: undefined,
  defaultValue: undefined,
  ariaLabel: 'Menu bar',
  variant: 'default',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
  select: [item: VfNavMenuItem];
}>();

const rootRef = ref<HTMLElement | null>(null);
const overlayRef = ref<HTMLElement | null>(null);
const teleportReady = ref(false);
const internalValue = ref(props.defaultValue);
const openPath = ref<string[]>([]);
const tabbableValue = ref(getFocusableItems(props.items)[0]?.value);
const activeValue = computed(() => props.modelValue ?? internalValue.value);
let closeMenuTimer: ReturnType<typeof setTimeout> | undefined;

interface MenuItemContext {
  item: VfNavMenuItem;
  parent?: MenuItemContext;
  siblings: VfNavMenuItem[];
}

function isBranch(item: VfNavMenuItem) {
  return item.kind !== 'group' && Boolean(item.children?.length);
}

function getFocusableItems(items: VfNavMenuItem[] = []): VfNavMenuItem[] {
  return items.flatMap((item) => {
    if (item.kind === 'group') {
      return getFocusableItems(item.children);
    }

    return item.disabled ? [] : [item];
  });
}

function findItemContext(
  items: VfNavMenuItem[],
  value: string,
  parent?: MenuItemContext,
  logicalSiblings = getFocusableItems(items),
): MenuItemContext | undefined {
  for (const item of items) {
    const context = { item, parent, siblings: logicalSiblings };

    if (item.value === value) {
      return context;
    }

    if (item.children?.length) {
      const match = findItemContext(
        item.children,
        value,
        context,
        item.kind === 'group' ? logicalSiblings : getFocusableItems(item.children),
      );

      if (match) {
        return match;
      }
    }
  }

  return undefined;
}

function getFocusableParent(context: MenuItemContext) {
  let parent = context.parent;

  while (parent?.item.kind === 'group') {
    parent = parent.parent;
  }

  return parent;
}

function getTopLevelContext(context: MenuItemContext) {
  let current = context;
  let parent = getFocusableParent(current);

  while (parent) {
    current = parent;
    parent = getFocusableParent(current);
  }

  return current;
}

function getMenuItemElement(value: string) {
  return Array.from(rootRef.value?.querySelectorAll<HTMLElement>('[data-vf-menu-value]') ?? []).find(
    (element) => element.dataset.vfMenuValue === value,
  );
}

function focusItem(value: string) {
  tabbableValue.value = value;
  void nextTick(() => {
    getMenuItemElement(value)?.focus();
  });
}

function resetTabbableValue() {
  tabbableValue.value = openPath.value[0] ?? getFocusableItems(props.items)[0]?.value;
}

function focusSibling(context: MenuItemContext, direction: 1 | -1) {
  const siblings = getFocusableItems(context.siblings);
  const currentIndex = siblings.findIndex((item) => item.value === context.item.value);

  if (currentIndex < 0 || siblings.length === 0) {
    return;
  }

  const nextIndex = (currentIndex + direction + siblings.length) % siblings.length;
  const sibling = siblings[nextIndex];

  if (sibling) {
    focusItem(sibling.value);
  }
}

function focusBoundary(context: MenuItemContext, boundary: 'first' | 'last') {
  const siblings = getFocusableItems(context.siblings);
  const target = boundary === 'first' ? siblings[0] : siblings[siblings.length - 1];

  if (target) {
    focusItem(target.value);
  }
}

function openAndFocusChild(context: MenuItemContext, boundary: 'first' | 'last' = 'first') {
  const children = getFocusableItems(context.item.children);
  const target = boundary === 'first' ? children[0] : children[children.length - 1];

  if (!target) {
    return;
  }

  openPath.value = [...getBranchPath(context), context.item.value];
  focusItem(target.value);
}

function getBranchPath(context: MenuItemContext) {
  const path: string[] = [];
  let parent = context.parent;

  while (parent) {
    if (isBranch(parent.item)) {
      path.unshift(parent.item.value);
    }

    parent = parent.parent;
  }

  return path;
}

function closeAndFocusParent(context: MenuItemContext) {
  const parent = getFocusableParent(context);

  if (!parent) {
    return;
  }

  openPath.value = getBranchPath(parent);
  focusItem(parent.item.value);
}

function moveToTopLevel(context: MenuItemContext, direction: 1 | -1) {
  const topLevelContext = getTopLevelContext(context);
  const topLevelItems = getFocusableItems(props.items);
  const currentIndex = topLevelItems.findIndex((item) => item.value === topLevelContext.item.value);

  if (currentIndex < 0 || topLevelItems.length === 0) {
    return;
  }

  const nextItem = topLevelItems[(currentIndex + direction + topLevelItems.length) % topLevelItems.length];

  if (!nextItem) {
    return;
  }

  openPath.value = isBranch(nextItem) && openPath.value.length > 0 ? [nextItem.value] : [];
  focusItem(nextItem.value);
}

function handleKeydown(event: KeyboardEvent) {
  const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-vf-menu-value]') : null;
  const value = target?.dataset.vfMenuValue;

  if (!value) {
    return;
  }

  const context = findItemContext(props.items, value);

  if (!context) {
    return;
  }

  const parent = getFocusableParent(context);
  const isTopLevel = !parent;

  if (event.key === 'Tab') {
    const topLevelValue = getTopLevelContext(context).item.value;
    void nextTick(() => {
      openPath.value = [];
      tabbableValue.value = topLevelValue;
    });
    return;
  }

  if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault();
    focusBoundary(context, event.key === 'Home' ? 'first' : 'last');
    return;
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    if (isTopLevel && isBranch(context.item)) {
      openAndFocusChild(context);
    } else {
      focusSibling(context, 1);
    }
    return;
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault();
    if (isTopLevel && isBranch(context.item)) {
      openAndFocusChild(context, 'last');
    } else {
      focusSibling(context, -1);
    }
    return;
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault();
    if (!isTopLevel && isBranch(context.item)) {
      openAndFocusChild(context);
    } else {
      moveToTopLevel(context, 1);
    }
    return;
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    if (isTopLevel) {
      moveToTopLevel(context, -1);
    } else {
      closeAndFocusParent(context);
    }
    return;
  }

  if ((event.key === 'Enter' || event.key === ' ') && isBranch(context.item)) {
    event.preventDefault();
    if (openPath.value.includes(context.item.value)) {
      openPath.value = getBranchPath(context);
    } else {
      openAndFocusChild(context);
    }
    return;
  }

  if (event.key === 'Escape' && openPath.value.length > 0) {
    event.preventDefault();
    const topLevelValue = getTopLevelContext(context).item.value;
    openPath.value = [];
    focusItem(topLevelValue);
  }
}

function handleFocusin(event: FocusEvent) {
  const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-vf-menu-value]') : null;

  if (target?.dataset.vfMenuValue) {
    tabbableValue.value = target.dataset.vfMenuValue;
  }
}

function setActiveValue(value: string) {
  if (props.modelValue === undefined) {
    internalValue.value = value;
  }

  emit('update:modelValue', value);
  emit('change', value);
}

function handleSelect(item: VfNavMenuItem) {
  setActiveValue(item.value);
  resetTabbableValue();
  openPath.value = [];
  emit('select', item);
}

function handleOpenPathChange(path: string[]) {
  cancelCloseMenu();
  openPath.value = path;
}

function scheduleCloseMenu() {
  cancelCloseMenu();
  closeMenuTimer = setTimeout(() => {
    resetTabbableValue();
    openPath.value = [];
    closeMenuTimer = undefined;
  }, 120);
}

function cancelCloseMenu() {
  if (closeMenuTimer === undefined) {
    return;
  }

  clearTimeout(closeMenuTimer);
  closeMenuTimer = undefined;
}

useClickOutside(
  [rootRef, overlayRef],
  () => {
    resetTabbableValue();
    openPath.value = [];
  },
  {
    enabled: computed(() => openPath.value.length > 0),
  },
);

useEscapeKey(
  (event) => {
    if (openPath.value.length === 0) {
      return;
    }

    event.preventDefault();
    const triggerValue = openPath.value[0];
    openPath.value = [];
    if (triggerValue) {
      focusItem(triggerValue);
    }
  },
  {
    enabled: computed(() => openPath.value.length > 0),
  },
);

watch(
  () => props.items,
  () => {
    openPath.value = [];
    const current = tabbableValue.value ? findItemContext(props.items, tabbableValue.value) : undefined;
    if (!current || current.item.disabled || current.item.kind === 'group') {
      tabbableValue.value = getFocusableItems(props.items)[0]?.value;
    }
  },
  { deep: true },
);

onBeforeUnmount(() => {
  cancelCloseMenu();
});

onMounted(() => {
  teleportReady.value = true;
});
</script>

<template>
  <nav
    ref="rootRef"
    :class="['vf-menu-bar', `vf-menu-bar--${variant}`]"
    :aria-label="ariaLabel"
    @mouseenter="cancelCloseMenu"
    @mouseleave="scheduleCloseMenu"
    @keydown="handleKeydown"
    @focusin="handleFocusin"
  >
    <div ref="overlayRef" class="vf-menu-bar__overlay" />
    <VfHorizontalScroller
      class="vf-menu-bar__scroller"
      left-aria-label="Scroll menu left"
      right-aria-label="Scroll menu right"
      left-control-class="vf-menu-bar__scroll-button vf-menu-bar__scroll-button--left"
      right-control-class="vf-menu-bar__scroll-button vf-menu-bar__scroll-button--right"
      hidden-control-class="vf-menu-bar__scroll-button--hidden"
    >
      <ul class="vf-menu-bar__list" role="menubar">
        <VfMenuBarItemNode
          v-for="item in items"
          :key="item.value"
          :item="item"
          :depth="0"
          :parent-path="[]"
          :active-value="activeValue"
          :open-path="openPath"
          :tabbable-value="tabbableValue"
          :hover-enabled="openPath.length > 0"
          :submenu-teleport-target="overlayRef"
          :teleport-enabled="teleportReady"
          @open-path-change="handleOpenPathChange"
          @select="handleSelect"
        />
      </ul>
    </VfHorizontalScroller>
  </nav>
</template>
