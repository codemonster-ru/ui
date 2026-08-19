<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import LayoutsNavMenuNode, { type LayoutsNavMenuItem } from './LayoutsNavMenuNode.vue';
import './layouts-nav-menu.css';

const props = withDefaults(
  defineProps<{
    items: LayoutsNavMenuItem[];
    modelValue?: string;
    variant?: 'pills' | 'sidebar';
    compact?: boolean;
    ariaLabel?: string;
  }>(),
  {
    modelValue: undefined,
    variant: 'pills',
    compact: false,
    ariaLabel: 'Navigation',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  select: [item: LayoutsNavMenuItem];
}>();

const expandedValues = ref<string[]>([]);
const rootRef = ref<HTMLElement>();
const rootClasses = computed(() => [
  'layouts-nav',
  `layouts-nav--${props.variant}`,
  props.compact && props.variant === 'sidebar' && 'layouts-nav--sidebar-compact',
]);

function collectAncestorValues(items: LayoutsNavMenuItem[], targetValue?: string, parents: string[] = []): string[] {
  if (!targetValue) return [];

  for (const item of items) {
    if (item.value === targetValue) return parents;
    if (item.children?.length) {
      const result = collectAncestorValues(item.children, targetValue, [...parents, item.value]);
      if (result.length) return result;
    }
  }
  return [];
}

function syncExpandedState() {
  expandedValues.value = Array.from(
    new Set([...expandedValues.value, ...collectAncestorValues(props.items, props.modelValue)]),
  );
}

function handleSelect(item: LayoutsNavMenuItem) {
  emit('update:modelValue', item.value);
  emit('select', item);
}

function handleToggle(value: string) {
  expandedValues.value = expandedValues.value.includes(value)
    ? expandedValues.value.filter((itemValue) => itemValue !== value)
    : [...expandedValues.value, value];
}

function visibleControls() {
  return [...(rootRef.value?.querySelectorAll<HTMLButtonElement>('.layouts-nav__item') ?? [])].filter(
    (control) => control.offsetParent !== null && !control.disabled,
  );
}

function handleKeydown(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const target = event.target;
  if (!(target instanceof HTMLButtonElement) || !target.classList.contains('layouts-nav__item')) return;

  const controls = visibleControls();
  const index = controls.indexOf(target);
  let nextIndex: number | undefined;

  if (event.key === 'ArrowDown') nextIndex = (index + 1) % controls.length;
  else if (event.key === 'ArrowUp') nextIndex = (index - 1 + controls.length) % controls.length;
  else if (event.key === 'Home') nextIndex = 0;
  else if (event.key === 'End') nextIndex = controls.length - 1;
  else if (event.key === 'ArrowRight' && target.hasAttribute('aria-expanded')) {
    event.preventDefault();
    if (target.getAttribute('aria-expanded') === 'false') target.click();
    return;
  } else if (event.key === 'ArrowLeft' && target.getAttribute('aria-expanded') === 'true') {
    event.preventDefault();
    target.click();
    return;
  } else return;

  event.preventDefault();
  controls[nextIndex]?.focus();
}

watch(() => [props.items, props.modelValue], syncExpandedState, { immediate: true, deep: true });
</script>

<template>
  <nav ref="rootRef" :class="rootClasses" :aria-label="ariaLabel" @keydown="handleKeydown">
    <ul class="layouts-nav__list">
      <LayoutsNavMenuNode
        v-for="item in items"
        :key="item.value"
        :item="item"
        :level="0"
        :active-value="modelValue"
        :expanded-values="expandedValues"
        @select="handleSelect"
        @toggle="handleToggle"
      />
    </ul>
  </nav>
</template>
