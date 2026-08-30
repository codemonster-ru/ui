<script setup lang="ts">
import { computed, ref, useAttrs, useSlots, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import { useCmHydrated } from '../../internal/hydration';
import { assertCm, warnCm } from '../../internal/warn';
import { nextTabsValue, resolveTabsValue } from '@codemonster-ru/ui-runtime/core';

import type { CmTabItem } from './tabs.types';

defineOptions({ inheritAttrs: false });

const valuePattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;
const props = defineProps({
  id: { type: String, required: true },
  items: { type: Array as PropType<readonly CmTabItem[]>, required: true },
  modelValue: { type: String as PropType<string | null>, default: null },
  defaultValue: { type: String as PropType<string | null>, default: null },
});
const emit = defineEmits<{
  valueChange: [value: string];
  'update:modelValue': [value: string];
}>();
const attrs = useAttrs();
const slots = useSlots();

function itemSlotName(region: 'tab' | 'panel', value: string): string {
  return `${region}${value
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('')}`;
}

const normalizedItems = computed(() => {
  assertCm(props.id.trim() !== '' && props.items.length > 0, 'Tabs require a non-empty id and items.');
  const values = new Set<string>();
  const items: CmTabItem[] = [];
  for (const item of props.items) {
    if (
      !valuePattern.test(item.value) ||
      !item.label.trim() ||
      (item.content !== undefined && typeof item.content !== 'string') ||
      (item.content === undefined && !slots[itemSlotName('panel', item.value)]) ||
      values.has(item.value)
    ) {
      warnCm(`Invalid Tabs item: ${item.value}. The item is not rendered.`);
      continue;
    }
    values.add(item.value);
    items.push(item);
  }
  assertCm(items.length === 0 || items.some(({ disabled }) => !disabled), 'Tabs require an enabled item.');
  return items;
});
const localValue = ref(resolveTabsValue(normalizedItems.value, props.defaultValue) ?? '');
const activeValue = computed(
  () => resolveTabsValue(normalizedItems.value, props.modelValue === null ? localValue.value : props.modelValue) ?? '',
);
const classes = computed(() => mergeCmClasses('cm-tabs', attrs.class));
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['data-cm-controller', 'data-cm-tabs-value', 'onKeydown']));

function panelId(item: CmTabItem): string {
  return `${props.id}-panel-${item.value}`;
}

function select(item: CmTabItem, focus = false): void {
  if (item.disabled) return;
  if (props.modelValue === null) localValue.value = item.value;
  emit('update:modelValue', item.value);
  emit('valueChange', item.value);
  if (focus) document.getElementById(`${props.id}-tab-${item.value}`)?.focus();
}

function move(event: KeyboardEvent, item: CmTabItem): void {
  const host = (event.currentTarget as Element).closest('[dir]');
  const rtl = host?.getAttribute('dir')?.toLowerCase() === 'rtl' || document.documentElement.dir === 'rtl';
  const nextValue = nextTabsValue(normalizedItems.value, item.value, event.key, rtl ? 'rtl' : 'ltr');
  if (nextValue === null) return;
  event.preventDefault();
  const next = normalizedItems.value.find(({ value }) => value === nextValue);
  if (next) select(next, true);
}

useCmHydrated();
</script>

<template>
  <div v-bind="rootAttrs" :class="classes" data-cm-controller="tabs" :data-cm-tabs-value="activeValue">
    <div class="cm-tabs__list" role="tablist" aria-orientation="horizontal">
      <button
        v-for="item in normalizedItems"
        :id="`${props.id}-tab-${item.value}`"
        :key="item.value"
        class="cm-tabs__tab"
        type="button"
        role="tab"
        :aria-controls="panelId(item)"
        :aria-selected="activeValue === item.value"
        :tabindex="activeValue === item.value ? 0 : -1"
        :disabled="item.disabled || undefined"
        @click="select(item)"
        @keydown="move($event, item)"
      >
        <slot :name="itemSlotName('tab', item.value)" :item="item" :active="activeValue === item.value">
          {{ item.label }}
        </slot>
      </button>
    </div>
    <div
      v-for="item in normalizedItems"
      :id="panelId(item)"
      :key="`${item.value}-panel`"
      class="cm-tabs__panel"
      role="tabpanel"
      :aria-labelledby="`${props.id}-tab-${item.value}`"
      tabindex="0"
      :hidden="activeValue !== item.value"
    >
      <slot :name="itemSlotName('panel', item.value)" :item="item" :active="activeValue === item.value">
        {{ item.content }}
      </slot>
    </div>
  </div>
</template>
