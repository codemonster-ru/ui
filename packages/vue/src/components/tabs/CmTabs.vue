<script setup lang="ts">
import { computed, ref, useAttrs, useSlots, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
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
  if (!props.id.trim() || props.items.length === 0) throw new TypeError('Tabs require a non-empty id and items.');
  const values = new Set<string>();
  for (const item of props.items) {
    if (
      !valuePattern.test(item.value) ||
      !item.label.trim() ||
      (item.content !== undefined && typeof item.content !== 'string') ||
      (item.content === undefined && !slots[itemSlotName('panel', item.value)]) ||
      values.has(item.value)
    ) {
      throw new TypeError(`Invalid Tabs item: ${item.value}.`);
    }
    values.add(item.value);
  }
  if (!props.items.some(({ disabled }) => !disabled)) throw new TypeError('Tabs require an enabled item.');
  return props.items;
});
const fallbackValue = computed(() => normalizedItems.value.find(({ disabled }) => !disabled)!.value);
const localValue = ref(
  normalizedItems.value.some(({ disabled, value }) => !disabled && value === props.defaultValue)
    ? props.defaultValue!
    : fallbackValue.value,
);
const activeValue = computed(() =>
  normalizedItems.value.some(({ disabled, value }) => !disabled && value === props.modelValue)
    ? props.modelValue!
    : props.modelValue === null
      ? localValue.value
      : fallbackValue.value,
);
const classes = computed(() => mergeCmClasses('cm-tabs', attrs.class as CmClassValue));
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
  const enabled = normalizedItems.value.filter(({ disabled }) => !disabled);
  const index = enabled.findIndex(({ value }) => value === item.value);
  if (index < 0) return;
  const host = (event.currentTarget as Element).closest('[dir]');
  const rtl = host?.getAttribute('dir')?.toLowerCase() === 'rtl' || document.documentElement.dir === 'rtl';
  const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
  const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
  const last = enabled.length - 1;
  const nextIndex =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? last
        : event.key === forward
          ? (index + 1) % enabled.length
          : event.key === backward
            ? (index - 1 + enabled.length) % enabled.length
            : -1;
  if (nextIndex < 0) return;
  event.preventDefault();
  const next = enabled[nextIndex];
  if (next) select(next, true);
}
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
