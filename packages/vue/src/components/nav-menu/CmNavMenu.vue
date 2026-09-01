<script setup lang="ts">
import { computed, ref, useAttrs, watch, type PropType } from 'vue';

import { expandToActive, toggleBranchValue } from '@codemonster-ru/ui-runtime/core';
import { useCmHydrated } from '../../internal/hydration';
import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import CmNavMenuNode from './CmNavMenuNode.vue';
import type { CmNavMenuExpandMode, CmNavMenuItem, CmNavMenuVariant } from './nav-menu.types';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  items: { type: Array as PropType<readonly CmNavMenuItem[]>, required: true },
  value: { type: String as PropType<string | null>, default: null },
  expandedValues: { type: Array as PropType<readonly string[] | null>, default: null },
  expandMode: {
    type: String as PropType<CmNavMenuExpandMode>,
    default: 'multiple',
    validator: (value: string) => ['multiple', 'single'].includes(value),
  },
  variant: {
    type: String as PropType<CmNavMenuVariant>,
    default: 'sidebar',
    validator: (value: string) => ['sidebar', 'inline'].includes(value),
  },
  ariaLabel: { type: String, default: 'Main navigation' },
});
const emit = defineEmits<{
  valueChange: [value: string];
  expandedChange: [values: string[]];
  'update:value': [value: string];
  'update:expandedValues': [values: string[]];
}>();
const attrs = useAttrs();

const expandMode = computed(() => (props.expandMode === 'single' ? 'single' : 'multiple'));
const variant = computed(() => (props.variant === 'inline' ? 'inline' : 'sidebar'));

// Uncontrolled menus open the path to the active item themselves, because an active item nobody
// can see is the failure that matters here.
const localExpanded = ref<string[]>(
  props.expandedValues === null ? expandToActive(props.items, [], props.value) : [...props.expandedValues],
);
watch(
  () => props.expandedValues,
  (values) => {
    if (values !== null) localExpanded.value = [...values];
  },
);
watch(
  () => props.value,
  (value) => {
    if (props.expandedValues === null) localExpanded.value = expandToActive(props.items, localExpanded.value, value);
  },
);

const expanded = computed(() => (props.expandedValues === null ? localExpanded.value : [...props.expandedValues]));
const classes = computed(() => mergeCmClasses('cm-nav-menu', `cm-nav-menu--${variant.value}`, attrs.class));
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['class', 'aria-label', 'data-cm-controller']));

function onToggle(value: string): void {
  const next = toggleBranchValue(props.items, expanded.value, value, expandMode.value);
  if (props.expandedValues === null) localExpanded.value = next;
  emit('update:expandedValues', next);
  emit('expandedChange', next);
}

function onSelect(value: string): void {
  emit('update:value', value);
  emit('valueChange', value);
}

useCmHydrated();
</script>

<template>
  <nav v-bind="rootAttrs" :class="classes" :aria-label="props.ariaLabel" data-cm-controller="nav-menu">
    <ul class="cm-nav-menu__list">
      <CmNavMenuNode
        v-for="item in props.items"
        :key="item.value"
        :item="item"
        :level="0"
        :active-value="props.value"
        :expanded-values="expanded"
        @toggle="onToggle"
        @select="onSelect"
      />
    </ul>
  </nav>
</template>
