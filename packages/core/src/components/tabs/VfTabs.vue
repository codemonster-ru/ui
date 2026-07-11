<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useSlots, watch, type CSSProperties } from 'vue';
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
const indicatorStyle = ref<CSSProperties>({
  opacity: '0',
  transform: 'translateX(0)',
  width: '0',
});

const fallbackValue = computed(() => props.items.find((item) => !item.disabled)?.value);
const internalValue = ref(props.defaultValue ?? fallbackValue.value);
const isControlled = computed(() => props.modelValue !== undefined);
const activeValue = computed(() => props.modelValue ?? internalValue.value ?? fallbackValue.value);

let listResizeObserver: ResizeObserver | null = null;

function updateScrollState() {
  const list = listRef.value;

  if (!list) {
    canScrollLeft.value = false;
    canScrollRight.value = false;
    return;
  }

  const maxScrollLeft = list.scrollWidth - list.clientWidth;
  canScrollLeft.value = list.scrollLeft > 1;
  canScrollRight.value = maxScrollLeft - list.scrollLeft > 1;
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

function getEnabledItems() {
  return props.items.filter((item) => !item.disabled);
}

function focusTabByValue(value: string) {
  const index = props.items.findIndex((item) => item.value === value);
  tabRefs.value[index]?.focus();
}

function handleKeydown(event: KeyboardEvent, currentItem: VfTabItem) {
  const enabledItems = getEnabledItems();
  const currentIndex = enabledItems.findIndex((item) => item.value === currentItem.value);

  if (currentIndex === -1) {
    return;
  }

  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    event.preventDefault();
    const nextItem = enabledItems[(currentIndex + 1) % enabledItems.length];
    activateTab(nextItem);
    focusTabByValue(nextItem.value);
    return;
  }

  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    event.preventDefault();
    const nextItem = enabledItems[(currentIndex - 1 + enabledItems.length) % enabledItems.length];
    activateTab(nextItem);
    focusTabByValue(nextItem.value);
    return;
  }

  if (event.key === 'Home') {
    event.preventDefault();
    const firstItem = enabledItems[0];
    activateTab(firstItem);
    focusTabByValue(firstItem.value);
    return;
  }

  if (event.key === 'End') {
    event.preventDefault();
    const lastItem = enabledItems[enabledItems.length - 1];
    activateTab(lastItem);
    focusTabByValue(lastItem.value);
  }
}

function tabId(value: string) {
  return `${baseId.value}-tab-${value}`;
}

function panelId(value: string) {
  return `${baseId.value}-panel-${value}`;
}

function updateIndicator() {
  const list = listRef.value;
  const listContainer = list?.parentElement;
  const activeIndex = props.items.findIndex((item) => item.value === activeValue.value);
  const activeTab = activeIndex >= 0 ? tabRefs.value[activeIndex] : null;

  if (!activeTab || !list) {
    indicatorStyle.value = {
      opacity: '0',
      transform: 'translateX(0)',
      width: '0',
    };
    return;
  }

  const tabStart = activeTab.offsetLeft - list.scrollLeft;
  const tabEnd = tabStart + activeTab.offsetWidth;
  const leftScrollButton =
    canScrollLeft.value && listContainer
      ? (listContainer.querySelector('.vf-tabs__scroll-button--left') as HTMLElement | null)
      : null;
  const rightScrollButton =
    canScrollRight.value && listContainer
      ? (listContainer.querySelector('.vf-tabs__scroll-button--right') as HTMLElement | null)
      : null;
  const visibleInsetStart = leftScrollButton?.offsetWidth ?? 0;
  const visibleInsetEnd = rightScrollButton?.offsetWidth ?? 0;
  const visibleStart = Math.max(visibleInsetStart, tabStart);
  const visibleEnd = Math.min(list.clientWidth - visibleInsetEnd, tabEnd);
  const visibleWidth = Math.max(0, visibleEnd - visibleStart);
  const isVisible = visibleWidth > 0;

  indicatorStyle.value = {
    opacity: isVisible ? '1' : '0',
    transform: `translateX(${visibleStart}px)`,
    width: `${visibleWidth}px`,
  };

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
          :id="tabId(item.value)"
          :key="item.value"
          :ref="
            (element) => {
              tabRefs[index] = element as HTMLElement | null;
            }
          "
          :aria-controls="panelId(item.value)"
          :aria-selected="activeValue === item.value"
          :disabled="item.disabled"
          :tabindex="activeValue === item.value ? 0 : -1"
          class="vf-tabs__tab"
          role="tab"
          type="button"
          @click="activateTab(item)"
          @keydown="handleKeydown($event, item)"
        >
          <slot name="tab" v-bind="{ item, isActive: activeValue === item.value, index }">
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
      v-if="activeValue && slots.panel"
      :id="panelId(activeValue)"
      :aria-labelledby="tabId(activeValue)"
      class="vf-tabs__panel"
      role="tabpanel"
      tabindex="0"
    >
      <slot name="panel" v-bind="{ activeValue }" />
    </div>
  </div>
</template>
