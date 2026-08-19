<script setup lang="ts">
import { computed, nextTick, ref, watch, type CSSProperties } from 'vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
import {
  hasNavigationDescendant,
  navigationRel,
  type CoreNavigationRecipeItem,
} from './core-navigation-recipes.types';

const props = defineProps<{
  item: CoreNavigationRecipeItem;
  depth: number;
  parentPath: string[];
  activeValue?: string;
  openPath: string[];
  tabbableValue?: string;
  hoverEnabled: boolean;
  overlayTarget?: HTMLElement;
}>();

const emit = defineEmits<{
  openPathChange: [path: string[]];
  select: [item: CoreNavigationRecipeItem];
}>();

const currentPath = computed(() => [...props.parentPath, props.item.value]);
const hasChildren = computed(() => props.item.kind !== 'group' && Boolean(props.item.children?.length));
const isGroup = computed(() => props.item.kind === 'group');
const isLink = computed(() => props.item.href !== undefined);
const isActive = computed(() => props.activeValue === props.item.value);
const isAncestorActive = computed(
  () => !isActive.value && hasNavigationDescendant(props.item, props.activeValue),
);
const isOpen = computed(() => currentPath.value.every((value, index) => props.openPath[index] === value));
const isTabbable = computed(() => props.tabbableValue === props.item.value && !props.item.disabled);
const triggerRef = ref<HTMLElement>();
const submenuStyle = ref<CSSProperties>();
const teleported = computed(() => props.depth === 0 && Boolean(props.overlayTarget));

function toggle(): void {
  if (props.item.disabled) return;
  emit('openPathChange', isOpen.value ? props.parentPath : currentPath.value);
}

function select(event?: MouseEvent): void {
  if (props.item.disabled) {
    event?.preventDefault();
    return;
  }
  emit('select', props.item);
}

function openOnHover(): void {
  if (props.hoverEnabled && hasChildren.value && !props.item.disabled) {
    emit('openPathChange', currentPath.value);
  }
}

function positionSubmenu(): void {
  if (!teleported.value || !isOpen.value || !triggerRef.value) return;
  const rect = triggerRef.value.getBoundingClientRect();
  submenuStyle.value = {
    insetBlockStart: `${rect.bottom + 8}px`,
    left: `${rect.left}px`,
  };
}

watch(
  () => [isOpen.value, props.overlayTarget],
  () => void nextTick(positionSubmenu),
);
</script>

<template>
  <li
    :class="[
      'core-menu-bar-recipe__node',
      `core-menu-bar-recipe__node--depth-${depth}`,
      hasChildren && 'core-menu-bar-recipe__node--branch',
      isOpen && 'core-menu-bar-recipe__node--open',
    ]"
    role="none"
    @mouseenter="openOnHover"
  >
    <div v-if="isGroup" class="core-menu-bar-recipe__group" role="presentation">{{ item.label }}</div>

    <button
      v-else-if="hasChildren"
      ref="triggerRef"
      type="button"
      :class="[
        'core-menu-bar-recipe__item core-menu-bar-recipe__item--branch',
        depth === 0 && 'core-menu-bar-recipe__item--top',
        isAncestorActive && 'core-menu-bar-recipe__item--ancestor-active',
        isOpen && 'core-menu-bar-recipe__item--open',
      ]"
      role="menuitem"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      :tabindex="isTabbable ? 0 : -1"
      :data-core-menu-value="item.value"
      :disabled="item.disabled"
      @click="toggle"
    >
      <span class="core-menu-bar-recipe__item-content">
        <span v-if="item.leadingIcon" class="core-menu-bar-recipe__leading-icon" aria-hidden="true">
          <VueIconify :icon="item.leadingIcon" size="var(--cm-icon-size-md)" />
        </span>
        <span class="core-menu-bar-recipe__label">{{ item.label }}</span>
      </span>
      <span class="core-menu-bar-recipe__icon" aria-hidden="true">
        <VueIconify
          :icon="depth === 0 ? icons.chevronDown : isOpen ? icons.minus : icons.plus"
          size="var(--cm-icon-size-sm)"
        />
      </span>
    </button>

    <a
      v-else-if="isLink"
      :href="item.href"
      :target="item.target"
      :rel="navigationRel(item)"
      :class="[
        'core-menu-bar-recipe__item',
        depth === 0 && 'core-menu-bar-recipe__item--top',
        item.target === '_blank' && 'core-menu-bar-recipe__item--external',
        isActive && 'core-menu-bar-recipe__item--active',
        item.disabled && 'core-menu-bar-recipe__item--disabled',
      ]"
      role="menuitem"
      :aria-current="isActive ? 'page' : undefined"
      :aria-disabled="item.disabled || undefined"
      :tabindex="isTabbable ? 0 : -1"
      :data-core-menu-value="item.value"
      @click="select"
    >
      <span class="core-menu-bar-recipe__item-content">
        <span v-if="item.leadingIcon" class="core-menu-bar-recipe__leading-icon" aria-hidden="true">
          <VueIconify :icon="item.leadingIcon" size="var(--cm-icon-size-md)" />
        </span>
        <span class="core-menu-bar-recipe__label">{{ item.label }}</span>
      </span>
      <span v-if="item.target === '_blank'" class="core-menu-bar-recipe__icon" aria-hidden="true">
        <VueIconify :icon="icons.externalLink" size="var(--cm-icon-size-sm)" />
      </span>
    </a>

    <button
      v-else
      type="button"
      :class="[
        'core-menu-bar-recipe__item',
        depth === 0 && 'core-menu-bar-recipe__item--top',
        isActive && 'core-menu-bar-recipe__item--active',
      ]"
      role="menuitem"
      :aria-current="isActive ? 'page' : undefined"
      :tabindex="isTabbable ? 0 : -1"
      :data-core-menu-value="item.value"
      :disabled="item.disabled"
      @click="select()"
    >
      <span class="core-menu-bar-recipe__item-content">
        <span v-if="item.leadingIcon" class="core-menu-bar-recipe__leading-icon" aria-hidden="true">
          <VueIconify :icon="item.leadingIcon" size="var(--cm-icon-size-md)" />
        </span>
        <span class="core-menu-bar-recipe__label">{{ item.label }}</span>
      </span>
    </button>

    <ul v-if="isGroup && item.children?.length" class="core-menu-bar-recipe__group-list" role="group" :aria-label="item.label">
      <CoreMenuBarRecipeNode
        v-for="child in item.children"
        :key="child.value"
        :item="child"
        :depth="depth"
        :parent-path="parentPath"
        :active-value="activeValue"
        :open-path="openPath"
        :tabbable-value="tabbableValue"
        :hover-enabled="hoverEnabled"
        :overlay-target="overlayTarget"
        @open-path-change="emit('openPathChange', $event)"
        @select="emit('select', $event)"
      />
    </ul>

    <Teleport v-else-if="hasChildren" :to="overlayTarget ?? 'body'" :disabled="!teleported">
      <div
        v-if="isOpen"
        :class="[
          'core-menu-bar-recipe__submenu',
          depth === 0 ? 'core-menu-bar-recipe__submenu--root' : 'core-menu-bar-recipe__submenu--nested',
          teleported && 'core-menu-bar-recipe__submenu--teleported',
        ]"
        :style="teleported ? submenuStyle : undefined"
      >
        <ul class="core-menu-bar-recipe__submenu-list" role="menu">
          <CoreMenuBarRecipeNode
            v-for="child in item.children"
            :key="child.value"
            :item="child"
            :depth="depth + 1"
            :parent-path="currentPath"
            :active-value="activeValue"
            :open-path="openPath"
            :tabbable-value="tabbableValue"
            :hover-enabled="true"
            :overlay-target="overlayTarget"
            @open-path-change="emit('openPathChange', $event)"
            @select="emit('select', $event)"
          />
        </ul>
      </div>
    </Teleport>
  </li>
</template>
