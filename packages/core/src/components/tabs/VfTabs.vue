<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useSlots, watch, type CSSProperties } from 'vue';
import {
  isTabsItemSelected,
  resolveTabsActiveIndex,
  resolveTabsActiveValue,
  resolveTabsControlledPanelId,
  resolveTabsFallbackValue,
  resolveTabsIndicatorStyle,
  resolveTabsNavigationTarget,
  resolveTabsPanelId,
  resolveTabsScrollerState,
  resolveTabsTabId,
  resolveTabsTabIndex,
  TABS_INDICATOR_HIDDEN,
} from '@codemonster-ru/vueforge-shared-core';
import VfHorizontalScroller from '@/components/internal/VfHorizontalScroller.vue';
import { useId } from '@/composables';
import type { VfTabItem } from '@/types/components';

interface VfTabsProps {
  items: VfTabItem[];
  modelValue?: string;
  defaultValue?: string;
}

const props = withDefaults(defineProps<VfTabsProps>(), {
  modelValue: undefined,
  defaultValue: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
}>();
const slots = useSlots();

const baseId = useId({ prefix: 'vf-tabs' });
const listRef = ref<HTMLElement | null>(null);
const tabRefs = ref<Array<HTMLElement | null>>([]);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);
const scrollControlsReady = ref(false);
const scrollControlsAnimated = ref(false);
const isListScrolling = ref(false);
const indicatorReady = ref(false);
const indicatorStyle = ref<CSSProperties>(Object.fromEntries(TABS_INDICATOR_HIDDEN));

const fallbackValue = computed(() => resolveTabsFallbackValue(props.items));
const internalValue = ref(props.defaultValue ?? fallbackValue.value);
const isControlled = computed(() => props.modelValue !== undefined);
const activeValue = computed(() => resolveTabsActiveValue(props.modelValue, internalValue.value, props.items));
const activeItem = computed(() => props.items[resolveTabsActiveIndex(props.items, activeValue.value)]);

let listResizeObserver: ResizeObserver | null = null;

function updateScrollState() {
  const list = listRef.value;

  if (!list) {
    canScrollLeft.value = false;
    canScrollRight.value = false;
    return;
  }

  const directionHost = list.closest('[dir]');
  const isRtl =
    directionHost?.getAttribute('dir')?.toLowerCase() === 'rtl' || window.getComputedStyle(list).direction === 'rtl';
  const state = resolveTabsScrollerState({
    scrollWidth: list.scrollWidth,
    clientWidth: list.clientWidth,
    scrollLeft: list.scrollLeft,
    isRtl,
  });
  canScrollLeft.value = state.canScrollLeft;
  canScrollRight.value = state.canScrollRight;
}

watch(
  () => props.items,
  (items) => {
    const hasActiveItem = items.some((item) => item.value === activeValue.value && !item.disabled);

    if (!hasActiveItem && fallbackValue.value) {
      setActiveValue(fallbackValue.value);
    }
  },
  { deep: true },
);

function setActiveValue(value: string) {
  if (!isControlled.value) {
    internalValue.value = value;
  }

  emit('update:modelValue', value);
  emit('change', value);
}

function activateTab(item: VfTabItem) {
  if (!item.disabled) {
    setActiveValue(item.value);
  }
}

function focusTabByValue(value: string) {
  const index = props.items.findIndex((item) => item.value === value);
  tabRefs.value[index]?.focus();
}

function handleKeydown(event: KeyboardEvent, currentItem: VfTabItem) {
  const target = event.currentTarget instanceof Element ? event.currentTarget : null;
  const directionHost = target?.closest('[dir]');
  const isRtl =
    directionHost?.getAttribute('dir')?.toLowerCase() === 'rtl' ||
    (!directionHost && document.documentElement.getAttribute('dir')?.toLowerCase() === 'rtl');
  const nextItem = resolveTabsNavigationTarget(props.items, currentItem.value, event.key, isRtl);

  if (!nextItem) {
    return;
  }

  event.preventDefault();
  activateTab(nextItem as VfTabItem);
  focusTabByValue(nextItem.value);
}

function tabId(item: VfTabItem) {
  return resolveTabsTabId(baseId.value, item);
}

function panelId(item: VfTabItem) {
  return resolveTabsPanelId(baseId.value, item);
}

function controlledPanelId(item: VfTabItem) {
  return resolveTabsControlledPanelId(baseId.value, item, Boolean(slots.panel));
}

function updateIndicator() {
  const list = listRef.value;
  const listContainer = list?.parentElement;
  const activeIndex = resolveTabsActiveIndex(props.items, activeValue.value);
  const activeTab = activeIndex >= 0 ? tabRefs.value[activeIndex] : null;

  if (!activeTab || !list) {
    indicatorStyle.value = Object.fromEntries(resolveTabsIndicatorStyle(null));
    return;
  }

  const listBounds = list.getBoundingClientRect();
  const tabBounds = activeTab.getBoundingClientRect();
  const leftScrollButton =
    canScrollLeft.value && listContainer
      ? (listContainer.querySelector('.vf-tabs__scroll-button--left') as HTMLElement | null)
      : null;
  const rightScrollButton =
    canScrollRight.value && listContainer
      ? (listContainer.querySelector('.vf-tabs__scroll-button--right') as HTMLElement | null)
      : null;

  indicatorStyle.value = Object.fromEntries(
    resolveTabsIndicatorStyle({
      listLeft: listBounds.left,
      listClientWidth: list.clientWidth,
      tabLeft: tabBounds.left,
      tabWidth: tabBounds.width,
      insetStart: leftScrollButton?.offsetWidth ?? 0,
      insetEnd: rightScrollButton?.offsetWidth ?? 0,
    }),
  );

  updateScrollState();
}

function handleWindowResize() {
  updateScrollState();
  updateIndicator();
}

function handleScrollerState(payload: {
  canScrollLeft: boolean;
  canScrollRight: boolean;
  controlsReady: boolean;
  controlsAnimated: boolean;
  isScrolling: boolean;
}) {
  canScrollLeft.value = payload.canScrollLeft;
  canScrollRight.value = payload.canScrollRight;
  scrollControlsReady.value = payload.controlsReady;
  scrollControlsAnimated.value = payload.controlsAnimated;
  isListScrolling.value = payload.isScrolling;
  updateIndicator();
}

function handleViewportChange(element: HTMLElement | null) {
  listRef.value = element;
  if (element) {
    updateScrollState();
    updateIndicator();
  }
}

watch(
  () => [activeValue.value, props.items],
  async () => {
    await nextTick();
    updateScrollState();
    updateIndicator();
  },
  { deep: true, immediate: true },
);

onMounted(async () => {
  await nextTick();
  updateScrollState();
  updateIndicator();
  requestAnimationFrame(() => {
    indicatorReady.value = true;
  });

  if (typeof ResizeObserver !== 'undefined' && listRef.value) {
    listResizeObserver = new ResizeObserver(() => {
      updateIndicator();
      updateScrollState();
    });
    listResizeObserver.observe(listRef.value);
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleWindowResize);
  }
});

onBeforeUnmount(() => {
  listResizeObserver?.disconnect();

  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleWindowResize);
  }
});
</script>

<template>
  <div
    class="vf-tabs"
    :class="{
      'vf-tabs--scroll-controls-ready': scrollControlsReady,
      'vf-tabs--scroll-controls-animated': scrollControlsAnimated,
    }"
  >
    <VfHorizontalScroller
      class="vf-tabs__list"
      viewport-class="vf-tabs__list-scroller"
      left-control-class="vf-tabs__scroll-button vf-tabs__scroll-button--left"
      right-control-class="vf-tabs__scroll-button vf-tabs__scroll-button--right"
      hidden-control-class="vf-tabs__scroll-button--hidden"
      can-scroll-left-class="vf-tabs__list--can-scroll-left"
      can-scroll-right-class="vf-tabs__list--can-scroll-right"
      controls-ready-class="vf-tabs--scroll-controls-ready"
      controls-animated-class="vf-tabs--scroll-controls-animated"
      left-aria-label="Scroll tabs left"
      right-aria-label="Scroll tabs right"
      @viewport-change="handleViewportChange"
      @state-change="handleScrollerState"
    >
      <div role="tablist" aria-orientation="horizontal">
        <button
          v-for="(item, index) in items"
          :id="tabId(item)"
          :key="item.value"
          :ref="
            (element) => {
              tabRefs[index] = element as HTMLElement | null;
            }
          "
          :aria-controls="controlledPanelId(item)"
          :aria-selected="isTabsItemSelected(activeValue, item)"
          :disabled="item.disabled"
          :tabindex="resolveTabsTabIndex(activeValue, item)"
          class="vf-tabs__tab"
          role="tab"
          type="button"
          @click="activateTab(item)"
          @keydown="handleKeydown($event, item)"
        >
          <slot name="tab" v-bind="{ item, isActive: isTabsItemSelected(activeValue, item), index }">
            {{ item.label }}
          </slot>
        </button>
      </div>

      <template #overlay>
        <span aria-hidden="true" class="vf-tabs__baseline" />

        <span
          aria-hidden="true"
          class="vf-tabs__indicator"
          :class="[
            indicatorReady && 'vf-tabs__indicator--ready',
            isListScrolling && 'vf-tabs__indicator--no-transition',
          ]"
          :style="indicatorStyle"
        />
      </template>
    </VfHorizontalScroller>

    <div
      v-if="activeItem && slots.panel"
      :id="panelId(activeItem)"
      :aria-labelledby="tabId(activeItem)"
      class="vf-tabs__panel"
      role="tabpanel"
      tabindex="0"
    >
      <slot name="panel" v-bind="{ activeValue: activeItem.value }" />
    </div>
  </div>
</template>
