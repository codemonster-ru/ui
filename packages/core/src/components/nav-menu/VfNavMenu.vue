<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import VfNavMenuItemNode from './VfNavMenuItemNode.vue';
import type { VfNavMenuItem } from '@/types/components';

interface VfNavMenuProps {
  items: VfNavMenuItem[];
  modelValue?: string;
  defaultValue?: string;
  ariaLabel?: string;
  expandMode?: 'multiple' | 'single';
  variant?: 'default' | 'pills' | 'sidebar';
  compact?: boolean;
}

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
const isCompactSidebar = computed(() => props.variant === 'sidebar' && (props.compact ?? measuredCompactSidebar.value));
let resizeObserver: ResizeObserver | undefined;

function updateCompactSidebar() {
  const rootWidth = rootElement.value?.getBoundingClientRect().width ?? 0;
  const breakpointWidth = compactBreakpointProbe.value?.getBoundingClientRect().width ?? 0;

  measuredCompactSidebar.value = props.variant === 'sidebar' && breakpointWidth > 0 && rootWidth <= breakpointWidth;
}

function handleWindowResize() {
  updateCompactSidebar();
}

function hasMenuFeature(items: VfNavMenuItem[], predicate: (item: VfNavMenuItem) => boolean): boolean {
  return items.some(
    (item) => predicate(item) || (item.children?.length ? hasMenuFeature(item.children, predicate) : false),
  );
}

const hasGroups = computed(() => hasMenuFeature(props.items, (item) => item.kind === 'group'));
const hasLeadingIcons = computed(() => hasMenuFeature(props.items, (item) => Boolean(item.leadingIcon)));
const isSimpleMenu = computed(() => !hasGroups.value && !hasLeadingIcons.value);

function isBranch(item: VfNavMenuItem) {
  return item.kind !== 'group' && Boolean(item.children?.length);
}

function collectAncestorValues(items: VfNavMenuItem[], targetValue?: string, parents: string[] = []): string[] {
  if (!targetValue) {
    return [];
  }

  for (const item of items) {
    if (item.value === targetValue) {
      return parents;
    }

    if (item.children?.length) {
      const result = collectAncestorValues(item.children, targetValue, [...parents, item.value]);

      if (result.length) {
        return result;
      }
    }
  }

  return [];
}

function syncExpandedState() {
  const ancestorValues = collectAncestorValues(props.items, activeValue.value);
  expandedValues.value = Array.from(new Set([...expandedValues.value, ...ancestorValues]));
}

function getItemsAtPath(items: VfNavMenuItem[], path: string[]): VfNavMenuItem[] {
  if (!path.length) {
    return items;
  }

  const [current, ...rest] = path;
  const match = items.find((item) => item.value === current);

  if (!match?.children?.length) {
    return [];
  }

  return getItemsAtPath(match.children, rest);
}

function collectBranchValues(items: VfNavMenuItem[]): string[] {
  return items.flatMap((item) => {
    const descendants = item.children?.length ? collectBranchValues(item.children) : [];

    return isBranch(item) ? [item.value, ...descendants] : descendants;
  });
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
  expandedValues.value = Array.from(
    new Set([...expandedValues.value, ...collectAncestorValues(props.items, item.value)]),
  );
  emit('select', item);
}

function handleToggle(payload: { value: string; parentPath: string[] }) {
  const { value, parentPath } = payload;

  if (expandedValues.value.includes(value)) {
    expandedValues.value = expandedValues.value.filter((itemValue) => itemValue !== value);
    return;
  }

  if (props.expandMode === 'single') {
    const siblingItems = getItemsAtPath(props.items, parentPath);
    const siblingBranchValues = siblingItems
      .filter((item) => item.value !== value && isBranch(item))
      .flatMap((item) => collectBranchValues([item]));

    expandedValues.value = expandedValues.value.filter((itemValue) => !siblingBranchValues.includes(itemValue));
  }

  expandedValues.value = [...expandedValues.value, value];
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
  <nav
    ref="rootElement"
    :class="[
      'vf-nav-menu',
      `vf-nav-menu--${variant}`,
      isSimpleMenu && 'vf-nav-menu--simple',
      isCompactSidebar && 'vf-nav-menu--sidebar-compact',
    ]"
    :aria-label="ariaLabel"
  >
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
