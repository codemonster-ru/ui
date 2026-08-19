<script setup lang="ts">
import { computed } from 'vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';

export interface LayoutsNavMenuItem {
  value: string;
  label: string;
  leadingIcon?: string;
  disabled?: boolean;
  children?: LayoutsNavMenuItem[];
}

const props = defineProps<{
  item: LayoutsNavMenuItem;
  level: number;
  activeValue?: string;
  expandedValues: string[];
}>();

const emit = defineEmits<{
  select: [item: LayoutsNavMenuItem];
  toggle: [value: string];
}>();

const hasChildren = computed(() => Boolean(props.item.children?.length));
const isExpanded = computed(() => props.expandedValues.includes(props.item.value));
const isActive = computed(() => props.activeValue === props.item.value);
const isAncestorActive = computed(() => hasDescendantValue(props.item, props.activeValue));

function hasDescendantValue(item: LayoutsNavMenuItem, targetValue?: string): boolean {
  if (!targetValue || !item.children?.length) return false;
  return item.children.some((child) => child.value === targetValue || hasDescendantValue(child, targetValue));
}
</script>

<template>
  <li
    :class="[
      'layouts-nav__node',
      `layouts-nav__node--level-${level}`,
      isExpanded && 'layouts-nav__node--expanded',
      isActive && 'layouts-nav__node--active',
      isAncestorActive && 'layouts-nav__node--ancestor-active',
    ]"
  >
    <button
      v-if="hasChildren"
      :class="[
        'layouts-nav__item',
        'layouts-nav__item--branch',
        level === 0 && 'layouts-nav__item--top',
        isAncestorActive && 'layouts-nav__item--ancestor-active',
        isExpanded && 'layouts-nav__item--expanded',
      ]"
      type="button"
      :aria-expanded="isExpanded"
      :disabled="item.disabled"
      @click="emit('toggle', item.value)"
    >
      <span class="layouts-nav__item-content">
        <span v-if="item.leadingIcon" class="layouts-nav__leading-icon" aria-hidden="true">
          <VueIconify :icon="item.leadingIcon" size="var(--cm-icon-size-md)" />
        </span>
        <span class="layouts-nav__label">{{ item.label }}</span>
      </span>
      <span :class="['layouts-nav__icon', isExpanded && 'layouts-nav__icon--open']" aria-hidden="true">
        <VueIconify :icon="icons.chevronDown" size="var(--cm-icon-size-sm)" />
      </span>
    </button>

    <button
      v-else
      :class="['layouts-nav__item', level === 0 && 'layouts-nav__item--top', isActive && 'layouts-nav__item--active']"
      type="button"
      :aria-current="isActive ? 'page' : undefined"
      :disabled="item.disabled"
      @click="emit('select', item)"
    >
      <span class="layouts-nav__item-content">
        <span v-if="item.leadingIcon" class="layouts-nav__leading-icon" aria-hidden="true">
          <VueIconify :icon="item.leadingIcon" size="var(--cm-icon-size-md)" />
        </span>
        <span class="layouts-nav__label">{{ item.label }}</span>
      </span>
    </button>

    <div v-if="hasChildren" class="layouts-nav__collapse" :aria-hidden="!isExpanded">
      <ul class="layouts-nav__list layouts-nav__list--nested">
        <LayoutsNavMenuNode
          v-for="child in item.children"
          :key="child.value"
          :item="child"
          :level="level + 1"
          :active-value="activeValue"
          :expanded-values="expandedValues"
          @select="emit('select', $event)"
          @toggle="emit('toggle', $event)"
        />
      </ul>
    </div>
  </li>
</template>
