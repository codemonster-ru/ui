<script setup lang="ts">
import { externalLink } from '@codemonster-ru/ui-icons/controls';
import { computed, resolveComponent, type Component, type PropType } from 'vue';

import CmIcon from '../icon/CmIcon.vue';
import type { CmNavMenuItem } from './nav-menu.types';

// The recursion lives in its own component because a template cannot include itself; the rules it
// renders from are all resolved by the parent, so this file only maps state to markup.
defineOptions({ name: 'CmNavMenuNode' });
const props = defineProps({
  item: { type: Object as PropType<CmNavMenuItem>, required: true },
  level: { type: Number, required: true },
  activeValue: { type: String as PropType<string | null>, default: null },
  expandedValues: { type: Array as PropType<readonly string[]>, required: true },
  linkComponent: { type: [String, Object, Function] as PropType<string | Component>, default: undefined },
});
defineEmits<{ toggle: [value: string]; select: [item: CmNavMenuItem] }>();

const hasChildren = computed(() => (props.item.children?.length ?? 0) > 0);
defineSlots<Record<string, (scope: { item: CmNavMenuItem }) => unknown>>();

const itemSlot = computed(
  () =>
    `item${props.item.value
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')}`,
);
const isGroup = computed(() => props.item.kind === 'group');
const isBranchItem = computed(() => hasChildren.value && !isGroup.value);
const isExpanded = computed(() => isGroup.value || props.expandedValues.includes(props.item.value));
const isActive = computed(() => props.item.value === props.activeValue);
const isRouted = computed(() => props.item.to !== undefined && !props.item.disabled);
const isLink = computed(() => props.item.to !== undefined || Boolean(props.item.href));
const destination = computed(() =>
  isRouted.value
    ? { to: props.item.to }
    : {
        href: isLink.value && !props.item.disabled ? props.item.href : undefined,
      },
);
const rel = computed(() => props.item.rel ?? (props.item.target === '_blank' ? 'noopener noreferrer' : undefined));
const isExternal = computed(() => isLink.value && !props.item.disabled && props.item.target === '_blank');

function leafComponent() {
  if (!isLink.value) return 'button';
  if (!isRouted.value) return 'a';
  return props.linkComponent ?? resolveComponent('RouterLink');
}

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
      <span class="cm-nav-menu__item-content">
        <CmIcon v-if="props.item.leadingIcon" class="cm-nav-menu__leading-icon" :icon="props.item.leadingIcon" />
        <slot :name="itemSlot" :item="props.item">
          <span class="cm-nav-menu__label">{{ props.item.label }}</span>
        </slot>
      </span>
      <span class="cm-nav-menu__icon" aria-hidden="true"></span>
    </button>
    <component
      :is="leafComponent()"
      v-else
      v-bind="destination"
      :class="leafClasses"
      :style="levelStyle"
      :type="isLink ? undefined : 'button'"
      :target="isLink ? props.item.target : undefined"
      :rel="isLink ? rel : undefined"
      :data-cm-nav-menu-value="props.item.value"
      :aria-current="isActive ? 'page' : undefined"
      :aria-disabled="isLink && props.item.disabled ? 'true' : undefined"
      :tabindex="isLink && props.item.disabled ? -1 : undefined"
      :disabled="!isLink && props.item.disabled ? true : undefined"
      @click="props.item.disabled ? $event.preventDefault() : $emit('select', props.item)"
    >
      <span class="cm-nav-menu__item-content">
        <CmIcon v-if="props.item.leadingIcon" class="cm-nav-menu__leading-icon" :icon="props.item.leadingIcon" />
        <slot :name="itemSlot" :item="props.item">
          <span class="cm-nav-menu__label">{{ props.item.label }}</span>
        </slot>
      </span>
      <CmIcon v-if="isExternal" class="cm-nav-menu__external-icon" :icon="externalLink" />
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
          :link-component="props.linkComponent"
          @toggle="$emit('toggle', $event)"
          @select="$emit('select', $event)"
        >
          <template v-for="name in Object.keys($slots)" #[name]="scope">
            <slot :name="name" v-bind="scope" />
          </template>
        </CmNavMenuNode>
      </ul>
    </div>
  </li>
</template>
