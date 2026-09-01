<script setup lang="ts">
import { computed, type PropType } from 'vue';

import type { CmNavMenuItem } from './nav-menu.types';

// The recursion lives in its own component because a template cannot include itself; the rules it
// renders from are all resolved by the parent, so this file only maps state to markup.
defineOptions({ name: 'CmNavMenuNode' });
const props = defineProps({
  item: { type: Object as PropType<CmNavMenuItem>, required: true },
  level: { type: Number, required: true },
  activeValue: { type: String as PropType<string | null>, default: null },
  expandedValues: { type: Array as PropType<readonly string[]>, required: true },
});
defineEmits<{ toggle: [value: string]; select: [value: string] }>();

const hasChildren = computed(() => (props.item.children?.length ?? 0) > 0);
const isGroup = computed(() => props.item.kind === 'group');
const isBranchItem = computed(() => hasChildren.value && !isGroup.value);
const isExpanded = computed(() => isGroup.value || props.expandedValues.includes(props.item.value));
const isActive = computed(() => props.item.value === props.activeValue);

const nodeClasses = computed(() => [
  'cm-nav-menu__node',
  `cm-nav-menu__node--level-${props.level}`,
  isExpanded.value && !isGroup.value ? 'cm-nav-menu__node--expanded' : undefined,
  isActive.value ? 'cm-nav-menu__node--active' : undefined,
]);
const levelStyle = computed(() => ({ '--cm-nav-menu-level': String(props.level) }));
const leafClasses = computed(() => [
  'cm-nav-menu__item',
  props.level === 0 ? 'cm-nav-menu__item--top' : undefined,
  isActive.value ? 'cm-nav-menu__item--active' : undefined,
  props.item.disabled ? 'cm-nav-menu__item--disabled' : undefined,
]);
const branchClasses = computed(() => [
  'cm-nav-menu__item',
  'cm-nav-menu__item--branch',
  props.level === 0 ? 'cm-nav-menu__item--top' : undefined,
  isExpanded.value ? 'cm-nav-menu__item--expanded' : undefined,
]);
</script>

<template>
  <li :class="nodeClasses">
    <div v-if="isGroup" class="cm-nav-menu__group" :style="levelStyle">
      <span class="cm-nav-menu__item-content"
        ><span class="cm-nav-menu__group-label">{{ props.item.label }}</span></span
      >
    </div>
    <button
      v-else-if="isBranchItem"
      :class="branchClasses"
      type="button"
      :style="levelStyle"
      :data-cm-nav-menu-branch="props.item.value"
      :aria-expanded="isExpanded"
      :disabled="props.item.disabled || undefined"
      @click="$emit('toggle', props.item.value)"
    >
      <span class="cm-nav-menu__item-content"
        ><slot :name="`item${props.item.value}`" :item="props.item"
          ><span class="cm-nav-menu__label">{{ props.item.label }}</span></slot
        ></span
      ><span class="cm-nav-menu__icon" aria-hidden="true"></span>
    </button>
    <component
      :is="props.item.href ? 'a' : 'button'"
      v-else
      :class="leafClasses"
      :style="levelStyle"
      :type="props.item.href ? undefined : 'button'"
      :href="props.item.href && !props.item.disabled ? props.item.href : undefined"
      :target="props.item.href ? props.item.target : undefined"
      :rel="props.item.href ? props.item.rel : undefined"
      :data-cm-nav-menu-value="props.item.value"
      :aria-current="isActive ? 'page' : undefined"
      :aria-disabled="props.item.href && props.item.disabled ? 'true' : undefined"
      :tabindex="props.item.href && props.item.disabled ? -1 : undefined"
      :disabled="!props.item.href && props.item.disabled ? true : undefined"
      @click="$emit('select', props.item.value)"
    >
      <span class="cm-nav-menu__item-content"
        ><slot :name="`item${props.item.value}`" :item="props.item"
          ><span class="cm-nav-menu__label">{{ props.item.label }}</span></slot
        ></span
      >
    </component>
    <div v-if="hasChildren" class="cm-nav-menu__collapse">
      <ul class="cm-nav-menu__list cm-nav-menu__list--nested">
        <CmNavMenuNode
          v-for="child in props.item.children"
          :key="child.value"
          :item="child"
          :level="props.level + 1"
          :active-value="props.activeValue"
          :expanded-values="props.expandedValues"
          @toggle="$emit('toggle', $event)"
          @select="$emit('select', $event)"
        />
      </ul>
    </div>
  </li>
</template>
