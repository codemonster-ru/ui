<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  resolveNavMenuCompact,
  resolveNavMenuIsSimple,
  resolveNavMenuMeasuredCompact,
  resolveNavMenuRootClasses,
  resolveNavMenuSyncedExpandedValues,
  resolveNavMenuToggledExpandedValues,
} from '@codemonster-ru/vueforge-shared-core';
import VfNavMenuItemNode from './VfNavMenuItemNode.vue';
import type { VfNavMenuItem, VfNavMenuProps } from '../../types/components';

const props = withDefaults(defineProps<VfNavMenuProps>(), {
  modelValue: undefined,
  defaultValue: undefined,
  ariaLabel: 'Navigation',
  expandMode: 'multiple',
  variant: 'default',
  compact: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
  select: [item: VfNavMenuItem];
}>();

const internalValue = ref(props.defaultValue);
const activeValue = computed(() => props.modelValue ?? internalValue.value);
const expandedValues = ref<string[]>([]);
const rootElement = ref<HTMLElement>();
const compactBreakpointProbe = ref<HTMLElement>();
const measuredCompactSidebar = ref(false);
const isCompactSidebar = computed(() =>
  resolveNavMenuCompact({ variant: props.variant, compact: props.compact, measured: measuredCompactSidebar.value }),
);
let resizeObserver: ResizeObserver | undefined;

function updateCompactSidebar() {
  const rootWidth = rootElement.value?.getBoundingClientRect().width ?? 0;
  const breakpointWidth = compactBreakpointProbe.value?.getBoundingClientRect().width ?? 0;

  measuredCompactSidebar.value = resolveNavMenuMeasuredCompact({ variant: props.variant, rootWidth, breakpointWidth });
}

function handleWindowResize() {
  updateCompactSidebar();
}

// The tree's rules - the ancestry, the union activation makes, the toggle and
// single mode - are shared with the Razor adapter; see
// packages/shared-core/src/nav-menu/state.ts.
const isSimpleMenu = computed(() => resolveNavMenuIsSimple(props.items));
const rootClasses = computed(() =>
  resolveNavMenuRootClasses({ variant: props.variant, simple: isSimpleMenu.value, compact: isCompactSidebar.value }),
);

function syncExpandedState() {
  expandedValues.value = resolveNavMenuSyncedExpandedValues(props.items, expandedValues.value, activeValue.value);
}

function setActiveValue(value: string) {
  if (props.modelValue === undefined) {
    internalValue.value = value;
  }

  emit('update:modelValue', value);
  emit('change', value);
}

function handleSelect(item: VfNavMenuItem) {
  setActiveValue(item.value);
  expandedValues.value = resolveNavMenuSyncedExpandedValues(props.items, expandedValues.value, item.value);
  emit('select', item);
}

function handleToggle(payload: { value: string; parentPath: string[] }) {
  expandedValues.value = resolveNavMenuToggledExpandedValues(
    props.items,
    expandedValues.value,
    payload.value,
    payload.parentPath,
    props.expandMode,
  );
}

watch(
  () => [props.items, activeValue.value],
  () => {
    syncExpandedState();
  },
  { immediate: true, deep: true },
);

watch(
  () => props.variant,
  () => {
    void nextTick(updateCompactSidebar);
  },
);

onMounted(() => {
  updateCompactSidebar();

  if (typeof ResizeObserver === 'undefined') {
    window.addEventListener('resize', handleWindowResize);
    return;
  }

  resizeObserver = new ResizeObserver(updateCompactSidebar);

  if (rootElement.value) {
    resizeObserver.observe(rootElement.value);
  }

  if (compactBreakpointProbe.value) {
    resizeObserver.observe(compactBreakpointProbe.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  window.removeEventListener('resize', handleWindowResize);
});
</script>

<template>
  <nav ref="rootElement" :class="rootClasses" :aria-label="ariaLabel">
    <span ref="compactBreakpointProbe" class="vf-nav-menu__compact-breakpoint-probe" aria-hidden="true" />
    <ul class="vf-nav-menu__list">
      <VfNavMenuItemNode
        v-for="item in items"
        :key="item.value"
        :item="item"
        :level="0"
        :parent-path="[]"
        :active-value="activeValue"
        :expanded-values="expandedValues"
        @toggle="handleToggle"
        @select="handleSelect"
      />
    </ul>
  </nav>
</template>
