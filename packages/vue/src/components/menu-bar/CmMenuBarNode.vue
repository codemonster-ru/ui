<script setup lang="ts">
import { computed, type PropType } from 'vue';

import type { CmMenuBarItem } from './menu-bar.types';

// Recursion needs its own component; every rule it renders from is resolved by the parent.
defineOptions({ name: 'CmMenuBarNode' });
const props = defineProps({
  item: { type: Object as PropType<CmMenuBarItem>, required: true },
  depth: { type: Number, required: true },
  openPath: { type: Array as PropType<readonly string[]>, required: true },
  activeValue: { type: String as PropType<string | null>, default: null },
  tabbableValue: { type: String as PropType<string | null>, default: null },
});
const emit = defineEmits<{ toggle: [value: string]; select: [value: string] }>();

const hasChildren = computed(() => (props.item.children?.length ?? 0) > 0);
const isOpen = computed(() => props.openPath.includes(props.item.value));
const isActive = computed(() => !hasChildren.value && props.activeValue === props.item.value);
const tabindex = computed(() => (props.item.disabled || props.tabbableValue !== props.item.value ? -1 : 0));
const nodeClasses = computed(() => [
  'cm-menu-bar__node',
  `cm-menu-bar__node--depth-${props.depth}`,
  hasChildren.value ? 'cm-menu-bar__node--branch' : undefined,
  isOpen.value ? 'cm-menu-bar__node--open' : undefined,
]);
const itemClasses = computed(() => [
  'cm-menu-bar__item',
  hasChildren.value ? 'cm-menu-bar__item--branch' : undefined,
  props.depth === 0 ? 'cm-menu-bar__item--top' : undefined,
  hasChildren.value && isOpen.value ? 'cm-menu-bar__item--open' : undefined,
  isActive.value ? 'cm-menu-bar__item--active' : undefined,
]);
const depthStyle = computed(() => ({ '--cm-menu-bar-depth': String(props.depth) }));

function select(event: MouseEvent): void {
  if (props.item.disabled) {
    event.preventDefault();
    return;
  }
  emit('select', props.item.value);
}
</script>

<template>
  <li :class="nodeClasses" role="none">
    <button
      v-if="hasChildren"
      :class="itemClasses"
      type="button"
      role="menuitem"
      :style="depthStyle"
      :data-cm-menu-bar-branch="props.item.value"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      :tabindex="tabindex"
      :disabled="props.item.disabled || undefined"
      @click="$emit('toggle', props.item.value)"
    >
      <slot :name="`item${props.item.value}`" :item="props.item"
        ><span class="cm-menu-bar__label">{{ props.item.label }}</span></slot
      ><span class="cm-menu-bar__icon" aria-hidden="true"></span>
    </button>
    <component
      :is="props.item.href ? 'a' : 'button'"
      v-else
      :class="itemClasses"
      role="menuitem"
      :style="depthStyle"
      :type="props.item.href ? undefined : 'button'"
      :href="props.item.href && !props.item.disabled ? props.item.href : undefined"
      :target="props.item.href ? props.item.target : undefined"
      :rel="props.item.href ? props.item.rel : undefined"
      :data-cm-menu-bar-value="props.item.value"
      :aria-current="isActive ? 'page' : undefined"
      :aria-disabled="props.item.href && props.item.disabled ? 'true' : undefined"
      :tabindex="tabindex"
      :disabled="!props.item.href && props.item.disabled ? true : undefined"
      @click="select"
    >
      <slot :name="`item${props.item.value}`" :item="props.item"
        ><span class="cm-menu-bar__label">{{ props.item.label }}</span></slot
      >
    </component>
    <ul v-if="hasChildren" class="cm-menu-bar__submenu" role="menu" :aria-label="props.item.label" :hidden="!isOpen">
      <CmMenuBarNode
        v-for="child in props.item.children"
        :key="child.value"
        :item="child"
        :depth="props.depth + 1"
        :open-path="props.openPath"
        :active-value="activeValue"
        :tabbable-value="tabbableValue"
        @toggle="$emit('toggle', $event)"
        @select="$emit('select', $event)"
      />
    </ul>
  </li>
</template>
