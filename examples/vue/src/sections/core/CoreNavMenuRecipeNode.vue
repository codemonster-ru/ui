<script setup lang="ts">
import { computed } from 'vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
import {
  hasNavigationDescendant,
  navigationRel,
  type CoreNavigationRecipeItem,
} from './core-navigation-recipes.types';

const props = defineProps<{
  item: CoreNavigationRecipeItem;
  level: number;
  parentPath: string[];
  activeValue?: string;
  expandedValues: string[];
  simple: boolean;
}>();

const emit = defineEmits<{
  select: [item: CoreNavigationRecipeItem];
  toggle: [payload: { value: string; parentPath: string[] }];
}>();

const hasChildren = computed(() => Boolean(props.item.children?.length));
const isGroup = computed(() => props.item.kind === 'group');
const isExpanded = computed(() => props.expandedValues.includes(props.item.value));
const isActive = computed(() => props.activeValue === props.item.value);
const isAncestorActive = computed(
  () => !isActive.value && hasNavigationDescendant(props.item, props.activeValue),
);
const isLink = computed(() => props.item.href !== undefined);

function toggle(): void {
  if (props.item.disabled) return;
  emit('toggle', { value: props.item.value, parentPath: props.parentPath });
}

function select(event?: MouseEvent): void {
  if (props.item.disabled) {
    event?.preventDefault();
    return;
  }
  emit('select', props.item);
}
</script>

<template>
  <li
    :class="[
      'core-nav-recipe__node',
      `core-nav-recipe__node--level-${level}`,
      isExpanded && 'core-nav-recipe__node--expanded',
      isActive && 'core-nav-recipe__node--active',
      isAncestorActive && 'core-nav-recipe__node--ancestor-active',
    ]"
  >
    <div v-if="isGroup" class="core-nav-recipe__group">
      <span class="core-nav-recipe__group-label">{{ item.label }}</span>
    </div>

    <button
      v-else-if="hasChildren"
      :class="[
        'core-nav-recipe__item core-nav-recipe__item--branch',
        level === 0 && 'core-nav-recipe__item--top',
        !simple && !item.leadingIcon && 'core-nav-recipe__item--icon-offset',
        isAncestorActive && 'core-nav-recipe__item--ancestor-active',
      ]"
      type="button"
      :aria-expanded="isExpanded"
      :disabled="item.disabled"
      @click="toggle"
    >
      <span class="core-nav-recipe__item-content">
        <span v-if="item.leadingIcon" class="core-nav-recipe__leading-icon" aria-hidden="true">
          <VueIconify :icon="item.leadingIcon" size="var(--cm-icon-size-md)" />
        </span>
        <span class="core-nav-recipe__label">{{ item.label }}</span>
      </span>
      <span :class="['core-nav-recipe__icon', isExpanded && 'core-nav-recipe__icon--open']" aria-hidden="true">
        <VueIconify :icon="icons.chevronDown" size="var(--cm-icon-size-sm)" />
      </span>
    </button>

    <a
      v-else-if="isLink"
      :href="item.href"
      :target="item.target"
      :rel="navigationRel(item)"
      :class="[
        'core-nav-recipe__item',
        level === 0 && 'core-nav-recipe__item--top',
        !simple && !item.leadingIcon && 'core-nav-recipe__item--icon-offset',
        isActive && 'core-nav-recipe__item--active',
        item.disabled && 'core-nav-recipe__item--disabled',
      ]"
      :aria-current="isActive ? 'page' : undefined"
      :aria-disabled="item.disabled || undefined"
      :tabindex="item.disabled ? -1 : undefined"
      @click="select"
    >
      <span class="core-nav-recipe__item-content">
        <span v-if="item.leadingIcon" class="core-nav-recipe__leading-icon" aria-hidden="true">
          <VueIconify :icon="item.leadingIcon" size="var(--cm-icon-size-md)" />
        </span>
        <span class="core-nav-recipe__label">{{ item.label }}</span>
      </span>
      <span v-if="item.target === '_blank'" class="core-nav-recipe__icon" aria-hidden="true">
        <VueIconify :icon="icons.externalLink" size="var(--cm-icon-size-sm)" />
      </span>
    </a>

    <button
      v-else
      :class="[
        'core-nav-recipe__item',
        level === 0 && 'core-nav-recipe__item--top',
        !simple && !item.leadingIcon && 'core-nav-recipe__item--icon-offset',
        isActive && 'core-nav-recipe__item--active',
      ]"
      type="button"
      :aria-current="isActive ? 'page' : undefined"
      :disabled="item.disabled"
      @click="select()"
    >
      <span class="core-nav-recipe__item-content">
        <span v-if="item.leadingIcon" class="core-nav-recipe__leading-icon" aria-hidden="true">
          <VueIconify :icon="item.leadingIcon" size="var(--cm-icon-size-md)" />
        </span>
        <span class="core-nav-recipe__label">{{ item.label }}</span>
      </span>
    </button>

    <ul v-if="hasChildren && isGroup" class="core-nav-recipe__list core-nav-recipe__list--nested">
      <CoreNavMenuRecipeNode
        v-for="child in item.children"
        :key="child.value"
        :item="child"
        :level="level + 1"
        :parent-path="[...parentPath, item.value]"
        :active-value="activeValue"
        :expanded-values="expandedValues"
        :simple="simple"
        @select="emit('select', $event)"
        @toggle="emit('toggle', $event)"
      />
    </ul>

    <div v-else-if="hasChildren" class="core-nav-recipe__collapse" :aria-hidden="!isExpanded">
      <ul class="core-nav-recipe__list core-nav-recipe__list--nested">
        <CoreNavMenuRecipeNode
          v-for="child in item.children"
          :key="child.value"
          :item="child"
          :level="level + 1"
          :parent-path="[...parentPath, item.value]"
          :active-value="activeValue"
          :expanded-values="expandedValues"
          :simple="simple"
          @select="emit('select', $event)"
          @toggle="emit('toggle', $event)"
        />
      </ul>
    </div>
  </li>
</template>
