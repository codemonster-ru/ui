<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
import CoreMenuBarRecipeNode from './CoreMenuBarRecipeNode.vue';
import type { CoreNavigationRecipeItem } from './core-navigation-recipes.types';
import './core-navigation-recipes.css';

const props = withDefaults(
  defineProps<{
    items: CoreNavigationRecipeItem[];
    modelValue?: string;
    defaultValue?: string;
    ariaLabel?: string;
    variant?: 'default' | 'pills';
  }>(),
  {
    modelValue: undefined,
    defaultValue: undefined,
    ariaLabel: 'Menu bar',
    variant: 'default',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
  select: [item: CoreNavigationRecipeItem];
}>();

interface ItemContext {
  item: CoreNavigationRecipeItem;
  parent?: ItemContext;
  siblings: CoreNavigationRecipeItem[];
}

const rootRef = ref<HTMLElement>();
const overlayRef = ref<HTMLElement>();
const viewportRef = ref<HTMLElement>();
const internalValue = ref(props.defaultValue);
const openPath = ref<string[]>([]);
const tabbableValue = ref(focusableItems(props.items)[0]?.value);
const activeValue = computed(() => props.modelValue ?? internalValue.value);
let closeTimer: ReturnType<typeof setTimeout> | undefined;
let resizeObserver: ResizeObserver | undefined;
const canScrollLeft = ref(false);
const canScrollRight = ref(false);
const controlsReady = ref(false);

function isBranch(item: CoreNavigationRecipeItem): boolean {
  return item.kind !== 'group' && Boolean(item.children?.length);
}

function focusableItems(items: CoreNavigationRecipeItem[] = []): CoreNavigationRecipeItem[] {
  return items.flatMap((item) =>
    item.kind === 'group' ? focusableItems(item.children) : item.disabled ? [] : [item],
  );
}

function findContext(
  items: CoreNavigationRecipeItem[],
  value: string,
  parent?: ItemContext,
  siblings = focusableItems(items),
): ItemContext | undefined {
  for (const item of items) {
    const context = { item, parent, siblings };
    if (item.value === value) return context;
    if (item.children?.length) {
      const match = findContext(
        item.children,
        value,
        context,
        item.kind === 'group' ? siblings : focusableItems(item.children),
      );
      if (match) return match;
    }
  }
  return undefined;
}

function focusableParent(context: ItemContext): ItemContext | undefined {
  let parent = context.parent;
  while (parent?.item.kind === 'group') parent = parent.parent;
  return parent;
}

function topContext(context: ItemContext): ItemContext {
  let current = context;
  let parent = focusableParent(current);
  while (parent) {
    current = parent;
    parent = focusableParent(current);
  }
  return current;
}

function branchPath(context: ItemContext): string[] {
  const path: string[] = [];
  let parent = context.parent;
  while (parent) {
    if (isBranch(parent.item)) path.unshift(parent.item.value);
    parent = parent.parent;
  }
  return path;
}

function itemElement(value: string): HTMLElement | undefined {
  return [...(rootRef.value?.querySelectorAll<HTMLElement>('[data-core-menu-value]') ?? [])].find(
    (element) => element.dataset.coreMenuValue === value,
  );
}

function focusItem(value: string): void {
  tabbableValue.value = value;
  void nextTick(() => itemElement(value)?.focus());
}

function focusSibling(context: ItemContext, delta: 1 | -1): void {
  const siblings = focusableItems(context.siblings);
  const index = siblings.findIndex((item) => item.value === context.item.value);
  const target = siblings[(index + delta + siblings.length) % siblings.length];
  if (target) focusItem(target.value);
}

function focusBoundary(context: ItemContext, end: boolean): void {
  const siblings = focusableItems(context.siblings);
  const target = end ? siblings[siblings.length - 1] : siblings[0];
  if (target) focusItem(target.value);
}

function openChild(context: ItemContext, end = false): void {
  const children = focusableItems(context.item.children);
  const target = end ? children[children.length - 1] : children[0];
  if (!target) return;
  openPath.value = [...branchPath(context), context.item.value];
  focusItem(target.value);
}

function focusParent(context: ItemContext): void {
  const parent = focusableParent(context);
  if (!parent) return;
  openPath.value = branchPath(parent);
  focusItem(parent.item.value);
}

function moveTop(context: ItemContext, delta: 1 | -1): void {
  const top = topContext(context);
  const items = focusableItems(props.items);
  const index = items.findIndex((item) => item.value === top.item.value);
  const target = items[(index + delta + items.length) % items.length];
  if (!target) return;
  openPath.value = isBranch(target) && openPath.value.length ? [target.value] : [];
  focusItem(target.value);
}

function handleKeydown(event: KeyboardEvent): void {
  const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-core-menu-value]') : null;
  const context = target?.dataset.coreMenuValue ? findContext(props.items, target.dataset.coreMenuValue) : undefined;
  if (!context) return;
  const parent = focusableParent(context);
  const topLevel = !parent;
  const rtl = getComputedStyle(rootRef.value ?? target ?? document.documentElement).direction === 'rtl';
  const openKey = rtl ? 'ArrowLeft' : 'ArrowRight';
  const closeKey = rtl ? 'ArrowRight' : 'ArrowLeft';

  if (event.key === 'Tab') {
    const topValue = topContext(context).item.value;
    void nextTick(() => {
      openPath.value = [];
      tabbableValue.value = topValue;
    });
    return;
  }
  if (event.key === 'Home' || event.key === 'End') {
    focusBoundary(context, event.key === 'End');
  } else if (event.key === 'ArrowDown') {
    if (topLevel && isBranch(context.item)) openChild(context);
    else focusSibling(context, 1);
  } else if (event.key === 'ArrowUp') {
    if (topLevel && isBranch(context.item)) openChild(context, true);
    else focusSibling(context, -1);
  } else if (event.key === openKey) {
    if (!topLevel && isBranch(context.item)) openChild(context);
    else moveTop(context, rtl ? -1 : 1);
  } else if (event.key === closeKey) {
    if (topLevel) moveTop(context, rtl ? 1 : -1);
    else focusParent(context);
  } else if ((event.key === 'Enter' || event.key === ' ') && isBranch(context.item)) {
    if (openPath.value.includes(context.item.value)) openPath.value = branchPath(context);
    else openChild(context);
  } else if (event.key === 'Escape' && openPath.value.length) {
    const topValue = topContext(context).item.value;
    openPath.value = [];
    focusItem(topValue);
  } else return;
  event.preventDefault();
}

function select(item: CoreNavigationRecipeItem): void {
  if (props.modelValue === undefined) internalValue.value = item.value;
  emit('update:modelValue', item.value);
  emit('change', item.value);
  emit('select', item);
  openPath.value = [];
  tabbableValue.value = focusableItems(props.items)[0]?.value;
}

function handleFocus(event: FocusEvent): void {
  const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-core-menu-value]') : null;
  if (target?.dataset.coreMenuValue) tabbableValue.value = target.dataset.coreMenuValue;
}

function close(): void {
  openPath.value = [];
  tabbableValue.value = focusableItems(props.items)[0]?.value;
}

function scheduleClose(): void {
  cancelClose();
  closeTimer = setTimeout(close, 120);
}

function cancelClose(): void {
  if (closeTimer !== undefined) clearTimeout(closeTimer);
  closeTimer = undefined;
}

function handleOutside(event: PointerEvent): void {
  if (rootRef.value && event.target instanceof Node && !rootRef.value.contains(event.target)) close();
}

function updateScrollState(): void {
  const viewport = viewportRef.value;
  if (!viewport) return;
  const max = viewport.scrollWidth - viewport.clientWidth;
  const rtl = getComputedStyle(viewport).direction === 'rtl';
  const offset = rtl ? Math.abs(Math.min(viewport.scrollLeft, 0)) : viewport.scrollLeft;
  canScrollLeft.value = rtl ? max - offset > 1 : offset > 1;
  canScrollRight.value = rtl ? offset > 1 : max - offset > 1;
}

function scrollMenu(direction: 'left' | 'right'): void {
  const viewport = viewportRef.value;
  if (!viewport) return;
  const delta = Math.max(120, Math.round(viewport.clientWidth * 0.6));
  viewport.scrollTo({
    left: viewport.scrollLeft + (direction === 'left' ? -delta : delta),
    behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  });
}

watch(
  () => props.items,
  () => {
    openPath.value = [];
    if (!tabbableValue.value || !findContext(props.items, tabbableValue.value)) {
      tabbableValue.value = focusableItems(props.items)[0]?.value;
    }
  },
  { deep: true },
);

onMounted(() => {
  document.addEventListener('pointerdown', handleOutside);
  requestAnimationFrame(() => {
    controlsReady.value = true;
    updateScrollState();
  });
  if (typeof ResizeObserver !== 'undefined' && viewportRef.value) {
    resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(viewportRef.value);
  }
  window.addEventListener('resize', updateScrollState);
});
onBeforeUnmount(() => {
  cancelClose();
  resizeObserver?.disconnect();
  document.removeEventListener('pointerdown', handleOutside);
  window.removeEventListener('resize', updateScrollState);
});
</script>

<template>
  <nav
    ref="rootRef"
    :class="['core-menu-bar-recipe', `core-menu-bar-recipe--${variant}`]"
    :aria-label="ariaLabel"
    @keydown="handleKeydown"
    @focusin="handleFocus"
    @mouseenter="cancelClose"
    @mouseleave="scheduleClose"
  >
    <button
      class="core-menu-bar-recipe__scroll-button core-menu-bar-recipe__scroll-button--left"
      :class="(!controlsReady || !canScrollLeft) && 'core-menu-bar-recipe__scroll-button--hidden'"
      type="button"
      aria-label="Scroll menu left"
      :aria-hidden="!controlsReady || !canScrollLeft"
      :tabindex="controlsReady && canScrollLeft ? 0 : -1"
      :disabled="!controlsReady || !canScrollLeft"
      @click="scrollMenu('left')"
    >
      <VueIconify :icon="icons.chevronLeft" size="1em" aria-hidden="true" />
    </button>
    <div ref="viewportRef" class="core-menu-bar-recipe__viewport" @scroll="updateScrollState">
      <ul class="core-menu-bar-recipe__list" role="menubar">
        <CoreMenuBarRecipeNode
          v-for="item in items"
          :key="item.value"
          :item="item"
          :depth="0"
          :parent-path="[]"
          :active-value="activeValue"
          :open-path="openPath"
          :tabbable-value="tabbableValue"
          :hover-enabled="openPath.length > 0"
          :overlay-target="overlayRef"
          @open-path-change="openPath = $event"
          @select="select"
        />
      </ul>
    </div>
    <div v-if="controlsReady && canScrollLeft" class="core-menu-bar-recipe__fade core-menu-bar-recipe__fade--left" />
    <div v-if="controlsReady && canScrollRight" class="core-menu-bar-recipe__fade core-menu-bar-recipe__fade--right" />
    <button
      class="core-menu-bar-recipe__scroll-button core-menu-bar-recipe__scroll-button--right"
      :class="(!controlsReady || !canScrollRight) && 'core-menu-bar-recipe__scroll-button--hidden'"
      type="button"
      aria-label="Scroll menu right"
      :aria-hidden="!controlsReady || !canScrollRight"
      :tabindex="controlsReady && canScrollRight ? 0 : -1"
      :disabled="!controlsReady || !canScrollRight"
      @click="scrollMenu('right')"
    >
      <VueIconify :icon="icons.chevronRight" size="1em" aria-hidden="true" />
    </button>
    <div ref="overlayRef" class="core-menu-bar-recipe__overlay" />
  </nav>
</template>
