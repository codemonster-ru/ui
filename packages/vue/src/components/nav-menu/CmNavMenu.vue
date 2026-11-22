<script setup lang="ts">
import { computed, ref, useAttrs, watch, type Component, type PropType } from 'vue';

import { expandToActive, toggleBranchValue } from '@codemonster-ru/ui-runtime/core';
import { useCmHydrated } from '../../internal/hydration';
import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import CmNavMenuNode from './CmNavMenuNode.vue';
import type { CmNavMenuExpandMode, CmNavMenuItem, CmNavMenuVariant } from './nav-menu.types';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  items: { type: Array as PropType<readonly CmNavMenuItem[]>, required: true },
  value: { type: String as PropType<string | null>, default: undefined },
  modelValue: { type: String as PropType<string | null>, default: undefined },
  defaultValue: { type: String as PropType<string | null>, default: null },
  linkComponent: { type: [String, Object, Function] as PropType<string | Component>, default: undefined },
  expandedValues: { type: Array as PropType<readonly string[] | null>, default: null },
  expandMode: {
    type: String as PropType<CmNavMenuExpandMode>,
    default: 'multiple',
    validator: (value: string) => ['multiple', 'single'].includes(value),
  },
  variant: {
    type: String as PropType<CmNavMenuVariant>,
    default: 'sidebar',
    validator: (value: string) => ['sidebar', 'inline', 'pills'].includes(value),
  },
  compact: { type: Boolean, default: undefined },
  ariaLabel: { type: String, default: 'Main navigation' },
});
const emit = defineEmits<{
  valueChange: [value: string];
  expandedChange: [values: string[]];
  change: [value: string];
  select: [item: CmNavMenuItem];
  'update:value': [value: string];
  'update:modelValue': [value: string];
  'update:expandedValues': [values: string[]];
}>();
const attrs = useAttrs();

const expandMode = computed(() => (props.expandMode === 'single' ? 'single' : 'multiple'));
const variant = computed(() => (props.variant === 'inline' || props.variant === 'pills' ? props.variant : 'sidebar'));
const localValue = ref(props.defaultValue);
const controlledValue = computed(() => (props.value === undefined ? props.modelValue : props.value));
const activeValue = computed(() => (controlledValue.value === undefined ? localValue.value : controlledValue.value));

// Uncontrolled menus open the path to the active item themselves, because an active item nobody
// can see is the failure that matters here.
const localExpanded = ref<string[]>(
  props.expandedValues === null ? expandToActive(props.items, [], activeValue.value) : [...props.expandedValues],
);
watch(
  () => props.expandedValues,
  (values) => {
    if (values !== null) localExpanded.value = [...values];
  },
);
watch(activeValue, (value) => {
  if (props.expandedValues === null) localExpanded.value = expandToActive(props.items, localExpanded.value, value);
});

const expanded = computed(() => (props.expandedValues === null ? localExpanded.value : [...props.expandedValues]));
const classes = computed(() =>
  mergeCmClasses(
    'cm-nav-menu',
    `cm-nav-menu--${variant.value}`,
    variant.value === 'sidebar' && props.compact !== undefined
      ? `cm-nav-menu--sidebar-${props.compact ? 'compact' : 'expanded'}`
      : undefined,
    attrs.class,
  ),
);
const rootAttrs = () =>
  omitCmOwnedAttrs(attrs, ['class', 'aria-label', 'data-cm-controller', 'data-cm-nav-menu-expand-mode']);

function onToggle(value: string): void {
  const next = toggleBranchValue(props.items, expanded.value, value, expandMode.value);
  if (props.expandedValues === null) localExpanded.value = next;
  emit('update:expandedValues', next);
  emit('expandedChange', next);
}

function onSelect(item: CmNavMenuItem): void {
  if (controlledValue.value === undefined) localValue.value = item.value;
  emit('update:value', item.value);
  emit('update:modelValue', item.value);
  emit('valueChange', item.value);
  emit('change', item.value);
  emit('select', item);
}

useCmHydrated();
</script>

<template>
  <nav
    v-bind="rootAttrs()"
    :class="classes"
    :aria-label="props.ariaLabel"
    data-cm-controller="nav-menu"
    :data-cm-nav-menu-expand-mode="expandMode === 'single' ? 'single' : undefined"
  >
    <ul class="cm-nav-menu__list">
      <CmNavMenuNode
        v-for="item in props.items"
        :key="item.value"
        :item="item"
        :level="0"
        :active-value="activeValue"
        :expanded-values="expanded"
        :link-component="props.linkComponent"
        @toggle="onToggle"
        @select="onSelect"
      >
        <template v-for="name in Object.keys($slots)" #[name]="scope">
          <slot :name="name" v-bind="scope" />
        </template>
      </CmNavMenuNode>
    </ul>
  </nav>
</template>
