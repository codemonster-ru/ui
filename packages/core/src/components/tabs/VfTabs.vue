<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useSlots, watch, type CSSProperties } from 'vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
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
  width: '0px',
});

const fallbackValue = computed(() => props.items.find((item) => !item.disabled)?.value);
const internalValue = ref(props.defaultValue ?? fallbackValue.value);
const isControlled = computed(() => props.modelValue !== undefined);
const activeValue = computed(() => props.modelValue ?? internalValue.value ?? fallbackValue.value);

let listResizeObserver: ResizeObserver | null = null;
let scrollStopTimeout: ReturnType<typeof setTimeout> | null = null;

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
      width: '0px',
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

function handleListScroll() {
  isListScrolling.value = true;
  if (scrollStopTimeout) {
    clearTimeout(scrollStopTimeout);
  }
  scrollStopTimeout = setTimeout(() => {
    isListScrolling.value = false;
  }, 120);

  updateScrollState();
  updateIndicator();
}

function handleWindowResize() {
  updateScrollState();
  updateIndicator();
}

function scrollListBy(direction: 'left' | 'right') {
  const list = listRef.value;

  if (!list) {
    return;
  }

  const delta = Math.max(120, Math.round(list.clientWidth * 0.6));
  const nextScrollLeft = direction === 'left' ? list.scrollLeft - delta : list.scrollLeft + delta;

  list.scrollTo({
    left: nextScrollLeft,
    behavior: 'smooth',
  });
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
  scrollControlsReady.value = true;
  requestAnimationFrame(() => {
    indicatorReady.value = true;
    requestAnimationFrame(() => {
      scrollControlsAnimated.value = true;
    });
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
  if (scrollStopTimeout) {
    clearTimeout(scrollStopTimeout);
  }

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
    <div
      class="vf-tabs__list"
      :class="[
        {
          'vf-tabs__list--can-scroll-left': canScrollLeft,
          'vf-tabs__list--can-scroll-right': canScrollRight,
        },
      ]"
      role="tablist"
      aria-orientation="horizontal"
    >
      <button
        aria-label="Scroll tabs left"
        :aria-hidden="!scrollControlsReady || !canScrollLeft"
        :tabindex="scrollControlsReady && canScrollLeft ? 0 : -1"
        class="vf-tabs__scroll-button vf-tabs__scroll-button--left"
        :class="{
          'vf-tabs__scroll-button--hidden': !scrollControlsReady || !canScrollLeft,
        }"
        type="button"
        :disabled="!scrollControlsReady || !canScrollLeft"
        @click="scrollListBy('left')"
      >
        <VueIconify :icon="icons.chevronLeft" aria-hidden="true" size="1.25em" />
      </button>

      <div ref="listRef" class="vf-tabs__list-scroller" @scroll="handleListScroll">
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

      <button
        aria-label="Scroll tabs right"
        :aria-hidden="!scrollControlsReady || !canScrollRight"
        :tabindex="scrollControlsReady && canScrollRight ? 0 : -1"
        class="vf-tabs__scroll-button vf-tabs__scroll-button--right"
        :class="{
          'vf-tabs__scroll-button--hidden': !scrollControlsReady || !canScrollRight,
        }"
        type="button"
        :disabled="!scrollControlsReady || !canScrollRight"
        @click="scrollListBy('right')"
      >
        <VueIconify :icon="icons.chevronRight" aria-hidden="true" size="1.25em" />
      </button>

      <span aria-hidden="true" class="vf-tabs__baseline" />

      <span
        aria-hidden="true"
        class="vf-tabs__indicator"
        :class="[indicatorReady && 'vf-tabs__indicator--ready', isListScrolling && 'vf-tabs__indicator--no-transition']"
        :style="indicatorStyle"
      />
    </div>

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
