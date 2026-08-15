<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import CoreNavMenuRecipeNode from './CoreNavMenuRecipeNode.vue';
import type { CoreNavigationRecipeItem } from './core-navigation-recipes.types';
import './core-navigation-recipes.css';

const props = withDefaults(
  defineProps<{
    items: CoreNavigationRecipeItem[];
    modelValue?: string;
    defaultValue?: string;
    ariaLabel?: string;
    variant?: 'default' | 'pills' | 'sidebar';
    compact?: boolean;
    wrapLabels?: boolean;
    expandMode?: 'single' | 'multiple';
  }>(),
  {
    modelValue: undefined,
    defaultValue: undefined,
    ariaLabel: 'Navigation',
    variant: 'default',
    compact: undefined,
    wrapLabels: false,
    expandMode: 'multiple',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
  select: [item: CoreNavigationRecipeItem];
}>();

const internalValue = ref(props.defaultValue);
const expandedValues = ref<string[]>([]);
const rootRef = ref<HTMLElement>();
const measuredCompact = ref(false);
let resizeObserver: ResizeObserver | undefined;

const activeValue = computed(() => props.modelValue ?? internalValue.value);
const compactSidebar = computed(
  () => props.variant === 'sidebar' && (props.compact ?? measuredCompact.value),
);
const simple = computed(() => !hasFeature(props.items, (item) => item.kind === 'group' || Boolean(item.leadingIcon)));

function hasFeature(items: CoreNavigationRecipeItem[], predicate: (item: CoreNavigationRecipeItem) => boolean): boolean {
  return items.some(
    (item) => predicate(item) || (item.children?.length ? hasFeature(item.children, predicate) : false),
  );
}

function isBranch(item: CoreNavigationRecipeItem): boolean {
  return item.kind !== 'group' && Boolean(item.children?.length);
}

function ancestorsOf(items: CoreNavigationRecipeItem[], target?: string, parents: string[] = []): string[] {
  if (!target) return [];
  for (const item of items) {
    if (item.value === target) return parents;
    if (item.children?.length) {
      const result = ancestorsOf(item.children, target, [...parents, item.value]);
      if (result.length) return result;
    }
  }
  return [];
}

function itemsAtPath(items: CoreNavigationRecipeItem[], path: string[]): CoreNavigationRecipeItem[] {
  if (!path.length) return items;
  const [value, ...rest] = path;
  const match = items.find((item) => item.value === value);
  return match?.children?.length ? itemsAtPath(match.children, rest) : [];
}

function branchValues(items: CoreNavigationRecipeItem[]): string[] {
  return items.flatMap((item) => [
    ...(isBranch(item) ? [item.value] : []),
    ...(item.children?.length ? branchValues(item.children) : []),
  ]);
}

function syncExpanded(): void {
  expandedValues.value = [...new Set([...expandedValues.value, ...ancestorsOf(props.items, activeValue.value)])];
}

function select(item: CoreNavigationRecipeItem): void {
  if (props.modelValue === undefined) internalValue.value = item.value;
  emit('update:modelValue', item.value);
  emit('change', item.value);
  emit('select', item);
}

function toggle({ value, parentPath }: { value: string; parentPath: string[] }): void {
  if (expandedValues.value.includes(value)) {
    expandedValues.value = expandedValues.value.filter((itemValue) => itemValue !== value);
    return;
  }
  if (props.expandMode === 'single') {
    const siblingBranches = branchValues(itemsAtPath(props.items, parentPath)).filter((itemValue) => itemValue !== value);
    expandedValues.value = expandedValues.value.filter((itemValue) => !siblingBranches.includes(itemValue));
  }
  expandedValues.value = [...expandedValues.value, value];
}

function visibleControls(): HTMLElement[] {
  return [...(rootRef.value?.querySelectorAll<HTMLElement>('.core-nav-recipe__item') ?? [])].filter(
    (control) => control.offsetParent !== null && control.getAttribute('aria-disabled') !== 'true' && !('disabled' in control && control.disabled),
  );
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const target = event.target instanceof Element ? event.target.closest<HTMLElement>('.core-nav-recipe__item') : null;
  if (!target) return;
  const controls = visibleControls();
  const index = controls.indexOf(target);
  let targetIndex: number | undefined;
  if (event.key === 'ArrowDown') targetIndex = (index + 1) % controls.length;
  else if (event.key === 'ArrowUp') targetIndex = (index - 1 + controls.length) % controls.length;
  else if (event.key === 'Home') targetIndex = 0;
  else if (event.key === 'End') targetIndex = controls.length - 1;
  else if (event.key === 'ArrowRight' && target.getAttribute('aria-expanded') === 'false') target.click();
  else if (event.key === 'ArrowLeft' && target.getAttribute('aria-expanded') === 'true') target.click();
  else return;
  event.preventDefault();
  if (targetIndex !== undefined) controls[targetIndex]?.focus();
}

function measureCompact(): void {
  measuredCompact.value = props.variant === 'sidebar' && (rootRef.value?.getBoundingClientRect().width ?? 0) <= 128;
}

watch(() => [props.items, activeValue.value], syncExpanded, { immediate: true, deep: true });
watch(() => props.variant, () => void nextTick(measureCompact));

onMounted(() => {
  measureCompact();
  if (typeof ResizeObserver === 'undefined') {
    window.addEventListener('resize', measureCompact);
    return;
  }
  resizeObserver = new ResizeObserver(measureCompact);
  if (rootRef.value) resizeObserver.observe(rootRef.value);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  window.removeEventListener('resize', measureCompact);
});
</script>

<template>
  <nav
    ref="rootRef"
    :class="[
      'core-nav-recipe',
      `core-nav-recipe--${variant}`,
      simple && 'core-nav-recipe--simple',
      compactSidebar && 'core-nav-recipe--sidebar-compact',
      wrapLabels && 'core-nav-recipe--wrap-labels',
    ]"
    :aria-label="ariaLabel"
    @keydown="handleKeydown"
  >
    <ul class="core-nav-recipe__list">
      <CoreNavMenuRecipeNode
        v-for="item in items"
        :key="item.value"
        :item="item"
        :level="0"
        :parent-path="[]"
        :active-value="activeValue"
        :expanded-values="expandedValues"
        :simple="simple"
        @select="select"
        @toggle="toggle"
      />
    </ul>
  </nav>
</template>
