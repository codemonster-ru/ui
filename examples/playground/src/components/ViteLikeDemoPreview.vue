<template>
  <div class="vf-playground" data-vf-theme="inherit">
    <div class="vf-playground__tabs">
      <div class="vite-demo-tabs">
        <div class="vite-demo-tabs__list">
          <div ref="tabScroller" class="vite-demo-tabs__scroller">
            <div ref="tablist" class="vite-demo-tabs__tablist" role="tablist" aria-orientation="horizontal">
              <button
                v-for="tab in tabItems"
                :id="tabId(tab.value)"
                :key="tab.value"
                class="vite-demo-tabs__tab"
                :data-demo-tab="tab.value"
                type="button"
                role="tab"
                :aria-controls="panelId(tab.value)"
                :aria-selected="activeTab === tab.value"
                :tabindex="activeTab === tab.value ? 0 : -1"
                @click="activateTab(tab.value)"
                @keydown="onTabKeydown($event, tab.value)"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>
          <span class="vite-demo-tabs__baseline" aria-hidden="true" />
          <span class="vite-demo-tabs__indicator" :style="indicatorStyle" aria-hidden="true" />
        </div>
      </div>
    </div>

    <div
      :id="panelId('preview')"
      class="vf-playground__panel preview"
      role="tabpanel"
      :aria-labelledby="tabId('preview')"
      :hidden="activeTab !== 'preview'"
      :tabindex="activeTab === 'preview' ? 0 : -1"
    >
      <component :is="demoComponent" />
    </div>

    <div
      :id="panelId('code')"
      class="vf-playground__panel vf-playground__panel--code"
      role="tabpanel"
      :aria-labelledby="tabId('code')"
      :hidden="activeTab !== 'code'"
      :tabindex="activeTab === 'code' ? 0 : -1"
    >
      <div class="vf-playground__codeblock-host">
        <VfCodeBlock :code="source" language="typescript" :show-line-numbers="true" theme="dark" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import type { Component, CSSProperties } from 'vue';
import { VfCodeBlock } from '@codemonster-ru/vueforge-codeblock/view';

import VueRuntimeSmokeDemo from 'virtual:vueforge-playground/vue-runtime-smoke';
import CustomResolverSmokeDemo from 'virtual:vueforge-playground/custom-resolver-smoke';

const props = defineProps<{
  demoId: 'vue-runtime-smoke' | 'custom-resolver-smoke';
  source: string;
}>();

type DemoTab = 'preview' | 'code';

const activeTab = ref<DemoTab>('preview');
const tablist = ref<HTMLElement | null>(null);
const tabScroller = ref<HTMLElement | null>(null);
const indicatorStyle = ref<CSSProperties>({ opacity: '0', transform: 'translateX(0)', width: '0' });
let tabResizeObserver: ResizeObserver | undefined;
const tabItems: ReadonlyArray<{ value: DemoTab; label: string }> = [
  { value: 'code', label: 'Code' },
  { value: 'preview', label: 'Preview' },
];

const demoComponentMap: Record<'vue-runtime-smoke' | 'custom-resolver-smoke', Component> = {
  'vue-runtime-smoke': VueRuntimeSmokeDemo,
  'custom-resolver-smoke': CustomResolverSmokeDemo,
};

const demoComponent = computed(() => demoComponentMap[props.demoId]);

function tabId(value: DemoTab): string {
  return `vite-demo-${props.demoId}-tab-${value}`;
}

function panelId(value: DemoTab): string {
  return `vite-demo-${props.demoId}-panel-${value}`;
}

function activateTab(value: DemoTab, focus = false): void {
  activeTab.value = value;
  void nextTick(updateIndicator);

  if (focus) {
    requestAnimationFrame(() => document.getElementById(tabId(value))?.focus());
  }
}

function onTabKeydown(event: KeyboardEvent, value: DemoTab): void {
  const currentIndex = tabItems.findIndex((tab) => tab.value === value);
  const isRtl = tablist.value ? getComputedStyle(tablist.value).direction === 'rtl' : false;
  let nextIndex: number | undefined;

  if (event.key === 'Home') {
    nextIndex = 0;
  } else if (event.key === 'End') {
    nextIndex = tabItems.length - 1;
  } else if (
    event.key === 'ArrowDown' ||
    (event.key === 'ArrowRight' && !isRtl) ||
    (event.key === 'ArrowLeft' && isRtl)
  ) {
    nextIndex = (currentIndex + 1) % tabItems.length;
  } else if (
    event.key === 'ArrowUp' ||
    (event.key === 'ArrowLeft' && !isRtl) ||
    (event.key === 'ArrowRight' && isRtl)
  ) {
    nextIndex = (currentIndex - 1 + tabItems.length) % tabItems.length;
  }

  if (nextIndex === undefined) return;

  event.preventDefault();
  activateTab(tabItems[nextIndex].value, true);
}

function updateIndicator(): void {
  const scroller = tabScroller.value;
  const activeButton = tablist.value?.querySelector<HTMLElement>(`[data-demo-tab="${activeTab.value}"]`);

  if (!scroller || !activeButton) return;

  const scrollerBounds = scroller.getBoundingClientRect();
  const tabBounds = activeButton.getBoundingClientRect();
  indicatorStyle.value = {
    opacity: '1',
    transform: `translateX(${tabBounds.left - scrollerBounds.left}px)`,
    width: `${tabBounds.width}px`,
  };
}

onMounted(() => {
  tabResizeObserver = new ResizeObserver(updateIndicator);
  if (tabScroller.value) tabResizeObserver.observe(tabScroller.value);
  for (const tab of tablist.value?.querySelectorAll('.vite-demo-tabs__tab') ?? []) {
    tabResizeObserver.observe(tab);
  }
  void nextTick(updateIndicator);
});

onBeforeUnmount(() => tabResizeObserver?.disconnect());
</script>

<style scoped>
.vite-demo-tabs {
  display: flex;
  min-width: 0;
  max-width: 100%;
  width: 100%;
  flex-direction: column;
  gap: 0;
  overflow-x: hidden;
}

.vite-demo-tabs__list {
  position: relative;
  min-width: 0;
  max-width: 100%;
  width: 100%;
  overflow: hidden;
  padding: 0 0 3px;
  background: var(--cm-color-background-surface-subtle);
}

.vite-demo-tabs__scroller {
  min-width: 0;
  max-width: 100%;
  width: 100%;
  overflow: auto hidden;
  scrollbar-width: none;
}

.vite-demo-tabs__scroller::-webkit-scrollbar {
  display: none;
}

.vite-demo-tabs__tablist {
  display: flex;
  min-width: 0;
  width: 100%;
  min-height: var(--cm-control-height-md);
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--cm-space-1);
}

.vite-demo-tabs__baseline {
  position: absolute;
  z-index: 1;
  right: 0;
  bottom: 0;
  left: 0;
  height: 1px;
  background: var(--cm-color-border-default);
  pointer-events: none;
}

.vite-demo-tabs__tab {
  position: relative;
  z-index: 1;
  display: inline-flex;
  min-height: var(--cm-control-height-md);
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  margin-bottom: 0;
  padding: 0 var(--cm-space-3);
  border: 0;
  border-radius: var(--cm-radius-control-tight) var(--cm-radius-control-tight) 0 0;
  background: var(--cm-color-background-surface-subtle);
  color: var(--cm-color-text-primary);
  cursor: pointer;
  font-size: var(--cm-control-font-size-md);
  font-weight: var(--cm-font-weight-medium);
  line-height: var(--cm-line-height-normal);
  white-space: nowrap;
  transition:
    background-color var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    color var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    box-shadow var(--cm-motion-duration-normal) var(--cm-motion-ease-standard);
}

.vite-demo-tabs__tab:hover:not([aria-selected='true']),
.vite-demo-tabs__tab:active:not([aria-selected='true']) {
  background: var(--cm-color-background-surface-subtle);
  color: var(--cm-color-text-primary);
}

.vite-demo-tabs__tab[aria-selected='true'] {
  background: transparent;
  color: var(--cm-color-selected-foreground);
}

.vite-demo-tabs__tab:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 var(--cm-focus-ring-width) var(--cm-color-focus-ring);
}

.vite-demo-tabs__indicator {
  position: absolute;
  z-index: 2;
  bottom: 0;
  left: 0;
  height: 3px;
  background: var(--cm-color-border-focus);
  pointer-events: none;
  transition:
    transform var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    width var(--cm-motion-duration-normal) var(--cm-motion-ease-standard),
    opacity var(--cm-motion-duration-fast) var(--cm-motion-ease-standard);
}

.vf-playground__panel[hidden] {
  display: none;
}

.vf-playground__panel.preview {
  min-height: 0;
  max-height: none;
  overflow: visible;
  display: grid;
  place-items: center;
  padding: 0;
}

.vf-playground__panel.preview > * {
  width: 100%;
  max-width: 100%;
}
</style>
