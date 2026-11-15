<script setup lang="ts">
import { computed, ref, useAttrs, useId, watch, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import { useCmHydrated } from '../../internal/hydration';
import { assertCm, warnCm } from '../../internal/warn';
import { nextTabsValue, resolveTabsValue } from '@codemonster-ru/ui-runtime/core';
import { observeTabScroll, scrollTabList, type CmTabScrollEdge } from '@codemonster-ru/ui-runtime/tabs-scroll';

import type { CmTabItem } from './tabs.types';

defineOptions({ inheritAttrs: false });

const valuePattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;
const idPattern = /^[^\s]+$/u;
const props = defineProps({
  id: { type: String, default: undefined },
  items: { type: Array as PropType<readonly CmTabItem[]>, required: true },
  modelValue: { type: String as PropType<string | null>, default: null },
  defaultValue: { type: String as PropType<string | null>, default: null },
  scrollControls: { type: Boolean, default: undefined },
});
const emit = defineEmits<{
  change: [value: string];
  valueChange: [value: string];
  'update:modelValue': [value: string];
}>();
const attrs = useAttrs();
const slots = defineSlots<{
  [name: `tab${string}`]:
    ((props: { item: CmTabItem; active: boolean; isActive: boolean; index: number }) => unknown) | undefined;
  [name: `panel${string}`]: ((props: { item: CmTabItem; active: boolean; activeValue: string }) => unknown) | undefined;
}>();
const tablist = ref<HTMLElement | null>(null);
const scrollEdges = ref({ start: false, end: false });
const renderScrollControls = computed(() => props.scrollControls ?? (scrollEdges.value.start || scrollEdges.value.end));
const scrollButtons = [
  { edge: 'start', label: 'Scroll to earlier tabs' },
  { edge: 'end', label: 'Scroll to later tabs' },
] as const;
const generatedId = `cm-tabs-${useId()}`;
const baseId = computed(() => props.id?.trim() || generatedId);

function itemSlotName<Region extends 'tab' | 'panel'>(region: Region, value: string): `${Region}${string}` {
  return `${region}${value
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('')}`;
}

function idSegment(value: string): string {
  if (valuePattern.test(value)) return value;
  return `~${Array.from(value, (character) => character.codePointAt(0)?.toString(16)).join('-')}`;
}

const normalizedItems = computed(() => {
  assertCm(props.id === undefined || idPattern.test(props.id), 'Tabs require a valid id when provided.');
  assertCm(props.items.length > 0, 'Tabs require items.');
  const values = new Set<string>();
  const ids = new Set<string>();
  const items: CmTabItem[] = [];
  for (const item of props.items) {
    const tab = tabId(item);
    const panel = panelId(item);
    if (
      !item.value.trim() ||
      !item.label.trim() ||
      (item.content !== undefined && typeof item.content !== 'string') ||
      !idPattern.test(tab) ||
      !idPattern.test(panel) ||
      tab === panel ||
      ids.has(tab) ||
      ids.has(panel) ||
      values.has(item.value)
    ) {
      warnCm(`Invalid Tabs item: ${item.value}. The item is not rendered.`);
      continue;
    }
    values.add(item.value);
    ids.add(tab);
    ids.add(panel);
    items.push(item);
  }
  assertCm(items.length === 0 || items.some(({ disabled }) => !disabled), 'Tabs require an enabled item.');
  return items;
});
const localValue = ref(resolveTabsValue(normalizedItems.value, props.defaultValue) ?? '');
const activeValue = computed(
  () => resolveTabsValue(normalizedItems.value, props.modelValue === null ? localValue.value : props.modelValue) ?? '',
);
watch(
  [tablist, normalizedItems, () => props.scrollControls],
  ([list, , controls], _, onCleanup) => {
    if (!list || controls === false) {
      scrollEdges.value = { start: false, end: false };
      return;
    }
    onCleanup(observeTabScroll(list, (edges) => (scrollEdges.value = edges)));
  },
  { flush: 'post' },
);
const classes = computed(() => mergeCmClasses('cm-tabs', attrs.class));
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['data-cm-controller', 'data-cm-tabs-value', 'onKeydown']));

function tabId(item: CmTabItem): string {
  return item.tabId ?? `${baseId.value}-tab-${idSegment(item.value)}`;
}

function panelId(item: CmTabItem): string {
  return item.panelId ?? `${baseId.value}-panel-${idSegment(item.value)}`;
}

function ownsPanel(item: CmTabItem): boolean {
  return !!slots[itemSlotName('panel', item.value)] || item.content !== undefined || !!slots.panel;
}

function select(item: CmTabItem, focus = false): void {
  if (item.disabled) return;
  if (props.modelValue === null) localValue.value = item.value;
  emit('update:modelValue', item.value);
  emit('change', item.value);
  emit('valueChange', item.value);
  if (focus) {
    const buttons = tablist.value?.querySelectorAll<HTMLButtonElement>('.cm-tabs__tab') ?? [];
    [...buttons].find((button) => button.id === tabId(item))?.focus();
  }
}

function move(event: KeyboardEvent, item: CmTabItem): void {
  const target = event.currentTarget as HTMLElement;
  const host = target.closest('[dir]');
  const direction = host?.getAttribute('dir') ?? target.ownerDocument.documentElement.dir;
  const nextValue = nextTabsValue(
    normalizedItems.value,
    item.value,
    event.key,
    direction.toLowerCase() === 'rtl' ? 'rtl' : 'ltr',
  );
  if (nextValue === null) return;
  event.preventDefault();
  const next = normalizedItems.value.find(({ value }) => value === nextValue);
  if (next) select(next, true);
}

function scroll(edge: CmTabScrollEdge, event: MouseEvent): void {
  if (tablist.value && event.currentTarget instanceof HTMLElement) {
    scrollTabList(tablist.value, edge, event.currentTarget);
  }
}

useCmHydrated();
</script>

<template>
  <div v-bind="rootAttrs" :class="classes" data-cm-controller="tabs" :data-cm-tabs-value="activeValue">
    <div
      :id="renderScrollControls ? `${baseId}-list` : undefined"
      ref="tablist"
      class="cm-tabs__list"
      role="tablist"
      aria-orientation="horizontal"
    >
      <button
        v-for="(item, index) in normalizedItems"
        :id="tabId(item)"
        :key="item.value"
        class="cm-tabs__tab"
        type="button"
        role="tab"
        :aria-controls="ownsPanel(item) || item.panelId ? panelId(item) : undefined"
        :data-cm-tab-value="
          item.tabId || item.panelId || !ownsPanel(item) || !valuePattern.test(item.value) ? item.value : undefined
        "
        :aria-selected="activeValue === item.value"
        :tabindex="activeValue === item.value ? 0 : -1"
        :disabled="item.disabled || undefined"
        @click="select(item)"
        @keydown="move($event, item)"
      >
        <slot
          :name="itemSlotName('tab', item.value)"
          :item="item"
          :active="activeValue === item.value"
          :is-active="activeValue === item.value"
          :index="index"
        >
          <slot
            name="tab"
            :item="item"
            :active="activeValue === item.value"
            :is-active="activeValue === item.value"
            :index="index"
          >
            {{ item.label }}
          </slot>
        </slot>
      </button>
    </div>
    <template v-if="renderScrollControls">
      <button
        v-for="{ edge, label } in scrollButtons"
        :key="edge"
        type="button"
        class="cm-tabs__scroll"
        :data-cm-tabs-scroll="edge"
        :aria-label="label"
        :aria-controls="`${baseId}-list`"
        :hidden="!scrollEdges[edge]"
        @click="scroll(edge, $event)"
      ></button>
    </template>
    <template v-for="item in normalizedItems" :key="`${item.value}-panel`">
      <div
        v-if="ownsPanel(item)"
        :id="panelId(item)"
        class="cm-tabs__panel"
        role="tabpanel"
        :aria-labelledby="tabId(item)"
        tabindex="0"
        :hidden="activeValue !== item.value"
      >
        <slot
          :name="itemSlotName('panel', item.value)"
          :item="item"
          :active="activeValue === item.value"
          :active-value="activeValue"
        >
          <template v-if="item.content !== undefined">{{ item.content }}</template>
          <slot
            v-else-if="activeValue === item.value"
            name="panel"
            :item="item"
            :active="true"
            :active-value="activeValue"
          />
        </slot>
      </div>
    </template>
  </div>
</template>
