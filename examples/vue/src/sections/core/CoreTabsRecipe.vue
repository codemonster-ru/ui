<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch, type CSSProperties } from 'vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';

interface CoreTabsRecipeItem {
  value: string;
  label: string;
  disabled?: boolean;
}

const props = defineProps<{
  items: readonly CoreTabsRecipeItem[];
  modelValue?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const slots = defineSlots<{
  panel?: (scope: { activeValue: string }) => unknown;
}>();

const baseId = `core-tabs-${useId()}`;
const listRef = ref<HTMLElement | null>(null);
const tabRefs = ref<Array<HTMLButtonElement | null>>([]);
const indicatorReady = ref(false);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);
const controlsReady = ref(false);
const controlsAnimated = ref(false);
const isListScrolling = ref(false);
const indicatorStyle = ref<CSSProperties>({
  opacity: '0',
  transform: 'translateX(0)',
  width: '0',
});
const fallbackValue = computed(() => props.items.find((item) => !item.disabled)?.value);
const activeValue = computed(() => {
  const activeItem = props.items.find((item) => item.value === props.modelValue && !item.disabled);

  return activeItem?.value ?? fallbackValue.value;
});
const activeItem = computed(() => props.items.find((item) => item.value === activeValue.value));
let resizeObserver: ResizeObserver | null = null;
let scrollStopTimeout: ReturnType<typeof setTimeout> | null = null;

function tabId(value: string) {
  return `${baseId}-tab-${value}`;
}

function panelId(value: string) {
  return `${baseId}-panel-${value}`;
}

function controlledPanelId(value: string) {
  return slots.panel ? panelId(value) : undefined;
}

function select(item: CoreTabsRecipeItem, focus = false) {
  if (item.disabled) return;

  emit('update:modelValue', item.value);
  if (focus) tabRefs.value[props.items.indexOf(item)]?.focus();
}

function handleKeydown(event: KeyboardEvent, item: CoreTabsRecipeItem) {
  const enabledItems = props.items.filter(({ disabled }) => !disabled);
  const currentIndex = enabledItems.findIndex(({ value }) => value === item.value);

  if (currentIndex < 0) return;

  const directionHost = (event.currentTarget as Element).closest('[dir]');
  const isRtl =
    directionHost?.getAttribute('dir')?.toLowerCase() === 'rtl' ||
    (!directionHost && document.documentElement.dir.toLowerCase() === 'rtl');
  const movesForward = event.key === 'ArrowDown' || (isRtl ? event.key === 'ArrowLeft' : event.key === 'ArrowRight');
  const movesBackward = event.key === 'ArrowUp' || (isRtl ? event.key === 'ArrowRight' : event.key === 'ArrowLeft');
  let nextIndex = -1;

  if (movesForward) nextIndex = (currentIndex + 1) % enabledItems.length;
  if (movesBackward) nextIndex = (currentIndex - 1 + enabledItems.length) % enabledItems.length;
  if (event.key === 'Home') nextIndex = 0;
  if (event.key === 'End') nextIndex = enabledItems.length - 1;
  if (nextIndex < 0) return;

  const nextItem = enabledItems[nextIndex];
  if (!nextItem) return;

  event.preventDefault();
  select(nextItem, true);
}

function updateIndicator() {
  const list = listRef.value;
  const listContainer = list?.parentElement;
  const activeIndex = props.items.findIndex(({ value }) => value === activeValue.value);
  const activeTab = activeIndex >= 0 ? tabRefs.value[activeIndex] : null;

  if (!list || !activeTab) {
    indicatorStyle.value = { opacity: '0', transform: 'translateX(0)', width: '0' };
    return;
  }

  const listBounds = list.getBoundingClientRect();
  const tabBounds = activeTab.getBoundingClientRect();
  const tabStart = tabBounds.left - listBounds.left;
  const tabEnd = tabStart + tabBounds.width;
  const leftControl = canScrollLeft.value
    ? listContainer?.querySelector<HTMLElement>('.demo-application-tabs__scroll-button--left')
    : null;
  const rightControl = canScrollRight.value
    ? listContainer?.querySelector<HTMLElement>('.demo-application-tabs__scroll-button--right')
    : null;
  const visibleStart = Math.max(leftControl?.offsetWidth ?? 0, tabStart);
  const visibleEnd = Math.min(list.clientWidth - (rightControl?.offsetWidth ?? 0), tabEnd);
  const visibleWidth = Math.max(0, visibleEnd - visibleStart);
  indicatorStyle.value = {
    opacity: visibleWidth > 0 ? '1' : '0',
    transform: `translateX(${visibleStart}px)`,
    width: `${visibleWidth}px`,
  };
}

function updateScrollState() {
  const list = listRef.value;

  if (!list) return;

  const maxScrollLeft = list.scrollWidth - list.clientWidth;
  const directionHost = list.closest('[dir]');
  const isRtl =
    directionHost?.getAttribute('dir')?.toLowerCase() === 'rtl' || window.getComputedStyle(list).direction === 'rtl';
  const scrollOffset = isRtl ? Math.abs(Math.min(list.scrollLeft, 0)) : list.scrollLeft;
  canScrollLeft.value = isRtl ? maxScrollLeft - scrollOffset > 1 : scrollOffset > 1;
  canScrollRight.value = isRtl ? scrollOffset > 1 : maxScrollLeft - scrollOffset > 1;
}

function handleScroll() {
  isListScrolling.value = true;
  if (scrollStopTimeout) clearTimeout(scrollStopTimeout);
  scrollStopTimeout = setTimeout(() => {
    isListScrolling.value = false;
  }, 140);
  updateScrollState();
  updateIndicator();
}

function scrollBy(direction: 'left' | 'right') {
  const list = listRef.value;

  if (!list) return;

  const delta = Math.max(120, Math.round(list.clientWidth * 0.6));
  list.scrollTo({
    left: list.scrollLeft + (direction === 'left' ? -delta : delta),
    behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  });
}

function handleWindowResize() {
  updateScrollState();
  updateIndicator();
}

watch(
  () => [activeValue.value, props.items],
  async () => {
    if (activeValue.value && activeValue.value !== props.modelValue) {
      emit('update:modelValue', activeValue.value);
    }

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
    controlsReady.value = true;
    updateScrollState();
    requestAnimationFrame(() => {
      controlsAnimated.value = true;
    });
  });

  if (typeof ResizeObserver !== 'undefined' && listRef.value) {
    resizeObserver = new ResizeObserver(handleWindowResize);
    resizeObserver.observe(listRef.value);
  }

  window.addEventListener('resize', handleWindowResize);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  if (scrollStopTimeout) clearTimeout(scrollStopTimeout);
  window.removeEventListener('resize', handleWindowResize);
});
</script>

<template>
  <div
    class="demo-application-tabs"
    :class="{
      'demo-application-tabs--scroll-controls-ready': controlsReady,
      'demo-application-tabs--scroll-controls-animated': controlsAnimated,
    }"
  >
    <div class="demo-application-tabs__list">
      <button
        class="demo-application-tabs__scroll-button demo-application-tabs__scroll-button--left"
        :class="!controlsReady || !canScrollLeft ? 'demo-application-tabs__scroll-button--hidden' : undefined"
        type="button"
        aria-label="Scroll tabs left"
        :aria-hidden="!controlsReady || !canScrollLeft"
        :tabindex="controlsReady && canScrollLeft ? 0 : -1"
        :disabled="!controlsReady || !canScrollLeft"
        @click="scrollBy('left')"
      >
        <VueIconify
          class="demo-application-tabs__scroll-icon"
          :icon="icons.chevronLeft"
          aria-hidden="true"
          size="1em"
        />
      </button>

      <div ref="listRef" class="demo-application-tabs__list-scroller" @scroll="handleScroll">
        <div role="tablist" aria-orientation="horizontal">
          <button
            v-for="(item, index) in items"
            :id="tabId(item.value)"
            :key="item.value"
            :ref="(element) => (tabRefs[index] = element as HTMLButtonElement | null)"
            class="demo-application-tabs__tab"
            type="button"
            role="tab"
            :aria-controls="controlledPanelId(item.value)"
            :aria-selected="activeValue === item.value"
            :disabled="item.disabled || undefined"
            :tabindex="activeValue === item.value ? 0 : -1"
            @click="select(item)"
            @keydown="handleKeydown($event, item)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <div
        v-if="controlsAnimated && canScrollLeft"
        class="demo-application-tabs__fade demo-application-tabs__fade--left"
        aria-hidden="true"
      />
      <div
        v-if="controlsAnimated && canScrollRight"
        class="demo-application-tabs__fade demo-application-tabs__fade--right"
        aria-hidden="true"
      />

      <button
        class="demo-application-tabs__scroll-button demo-application-tabs__scroll-button--right"
        :class="!controlsReady || !canScrollRight ? 'demo-application-tabs__scroll-button--hidden' : undefined"
        type="button"
        aria-label="Scroll tabs right"
        :aria-hidden="!controlsReady || !canScrollRight"
        :tabindex="controlsReady && canScrollRight ? 0 : -1"
        :disabled="!controlsReady || !canScrollRight"
        @click="scrollBy('right')"
      >
        <VueIconify
          class="demo-application-tabs__scroll-icon"
          :icon="icons.chevronRight"
          aria-hidden="true"
          size="1em"
        />
      </button>

      <span class="demo-application-tabs__baseline" aria-hidden="true" />
      <span
        class="demo-application-tabs__indicator"
        :class="[
          indicatorReady && 'demo-application-tabs__indicator--ready',
          isListScrolling && 'demo-application-tabs__indicator--no-transition',
        ]"
        :style="indicatorStyle"
        aria-hidden="true"
      />
    </div>

    <div
      v-if="activeItem && slots.panel"
      :id="panelId(activeItem.value)"
      class="demo-application-tabs__panel"
      role="tabpanel"
      :aria-labelledby="tabId(activeItem.value)"
      tabindex="0"
    >
      <slot name="panel" :active-value="activeItem.value" />
    </div>
  </div>
</template>

<style scoped>
.demo-application-tabs {
  display: flex;
  min-width: 0;
  max-width: 100%;
  flex-direction: column;
  gap: calc(var(--cm-space-3) - var(--cm-space-1));
  overflow-x: hidden;
}

.demo-application-tabs__list {
  position: relative;
  min-width: 0;
  max-width: 100%;
  width: 100%;
  overflow: hidden;
  padding: 0 0 3px;
  background: transparent;
}

.demo-application-tabs__list-scroller {
  min-width: 0;
  max-width: 100%;
  width: 100%;
  overflow: auto hidden;
  scrollbar-width: none;
}

.demo-application-tabs__list-scroller::-webkit-scrollbar {
  display: none;
}

.demo-application-tabs__list-scroller > [role='tablist'] {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: var(--cm-space-1);
  min-width: 0;
  width: 100%;
  min-height: var(--cm-control-height-md);
}

.demo-application-tabs__scroll-button {
  position: absolute;
  inset-block: 0;
  z-index: 4;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: var(--cm-color-background-surface);
  color: var(--cm-color-icon-secondary);
  cursor: pointer;
  font-size: var(--cm-control-font-size-md);
  line-height: 0;
}

.demo-application-tabs__scroll-button::after {
  position: absolute;
  inset-inline: 0;
  inset-block-end: -1px;
  height: 1px;
  background: var(--cm-color-background-surface);
  content: '';
  pointer-events: none;
}

.demo-application-tabs--scroll-controls-animated .demo-application-tabs__scroll-button {
  transition:
    background-color var(--cm-motion-duration-fast) var(--cm-motion-ease-standard),
    color var(--cm-motion-duration-fast) var(--cm-motion-ease-standard);
}

.demo-application-tabs__scroll-button :deep(.demo-application-tabs__scroll-icon) {
  transform: translateY(-3px);
}

.demo-application-tabs__scroll-button:hover {
  background: var(--cm-color-background-surface);
  color: var(--cm-color-icon-primary);
}

.demo-application-tabs__scroll-button:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 var(--cm-focus-ring-width) var(--cm-color-focus-ring);
}

.demo-application-tabs__scroll-button--hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.demo-application-tabs__scroll-button--left {
  left: 0;
}

.demo-application-tabs__scroll-button--right {
  right: 0;
}

.demo-application-tabs__fade {
  position: absolute;
  inset-block: 0;
  z-index: 3;
  width: 2rem;
  pointer-events: none;
}

.demo-application-tabs__fade--left {
  left: 1.75rem;
  background: linear-gradient(to right, var(--cm-color-background-surface), transparent);
}

.demo-application-tabs__fade--right {
  right: 1.75rem;
  background: linear-gradient(to left, var(--cm-color-background-surface), transparent);
}

.demo-application-tabs__baseline {
  position: absolute;
  inset-inline: 0;
  inset-block-end: 0;
  z-index: 1;
  height: 1px;
  background: var(--cm-color-border-divider);
  pointer-events: none;
}

.demo-application-tabs__tab {
  position: relative;
  z-index: 1;
  display: inline-flex;
  min-height: var(--cm-control-height-md);
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  margin-block-end: 0;
  padding: 0.3125rem var(--cm-space-3);
  border: 0;
  border-radius: var(--cm-radius-control-tight) var(--cm-radius-control-tight) 0 0;
  background: transparent;
  color: var(--cm-color-text-secondary);
  cursor: pointer;
  font: inherit;
  font-size: var(--cm-control-font-size-md);
  font-weight: var(--cm-font-weight-medium);
  line-height: var(--cm-line-height-normal);
  white-space: nowrap;
  transition:
    background-color var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    color var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    border-color var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    box-shadow var(--cm-motion-duration-normal) var(--cm-motion-ease-standard);
}

.demo-application-tabs__tab:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 var(--cm-focus-ring-width) var(--cm-color-focus-ring);
}

.demo-application-tabs__tab:disabled {
  background: transparent;
  color: var(--cm-color-text-disabled);
  cursor: not-allowed;
}

.demo-application-tabs__tab:hover:not(:disabled, [aria-selected='true']),
.demo-application-tabs__tab:active:not(:disabled, [aria-selected='true']) {
  background: transparent;
  color: var(--cm-color-text-primary);
}

.demo-application-tabs__tab[aria-selected='true']:not(:disabled) {
  background: transparent;
  color: var(--cm-color-selected-foreground);
}

.demo-application-tabs__indicator {
  position: absolute;
  inset-block-end: 0;
  inset-inline-start: 0;
  z-index: 2;
  display: block;
  height: 3px;
  background: var(--cm-color-selected-foreground);
  pointer-events: none;
}

.demo-application-tabs__indicator--ready {
  transition:
    transform var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    width var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    opacity var(--cm-motion-duration-fast) var(--cm-motion-ease-standard);
}

.demo-application-tabs__indicator--no-transition {
  transition: none;
}

.demo-application-tabs__panel {
  padding: var(--cm-space-3) 0 0;
  border: var(--cm-border-width) solid transparent;
  border-radius: var(--cm-radius-control);
  color: var(--cm-color-text-primary);
  font-size: var(--cm-control-font-size-md);
  font-weight: var(--cm-font-weight-regular);
  line-height: var(--cm-line-height-normal);
}

.demo-application-tabs__panel:focus-visible {
  border-color: var(--cm-color-border-focus);
  outline: none;
  box-shadow: 0 0 0 var(--cm-focus-ring-width) var(--cm-color-focus-ring);
}

@media (prefers-reduced-motion: reduce) {
  .demo-application-tabs__tab,
  .demo-application-tabs__indicator--ready {
    transition: none;
  }
}
</style>
