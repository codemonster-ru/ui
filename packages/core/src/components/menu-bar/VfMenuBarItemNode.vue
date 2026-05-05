<script setup lang="ts">
import { computed, resolveDynamicComponent } from 'vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
import type { VfNavMenuItem } from '@/types/components';

defineOptions({
  name: 'VfMenuBarItemNode',
});

const props = defineProps<{
  item: VfNavMenuItem;
  depth: number;
  parentPath: string[];
  activeValue?: string;
  openPath: string[];
  hoverEnabled?: boolean;
}>();

const emit = defineEmits<{
  openPathChange: [path: string[]];
  select: [item: VfNavMenuItem];
}>();

const currentPath = computed(() => [...props.parentPath, props.item.value]);
const hasChildren = computed(() => props.item.kind !== 'group' && Boolean(props.item.children?.length));
const isGroup = computed(() => props.item.kind === 'group');
const isLink = computed(() => props.item.href !== undefined || props.item.to !== undefined);
const isActive = computed(() => props.activeValue === props.item.value);
const isAncestorActive = computed(() => !isActive.value && hasDescendantValue(props.item, props.activeValue));
const isOpen = computed(() => currentPath.value.every((value, index) => props.openPath[index] === value));

const resolvedComponent = computed(() => {
  if (props.item.to !== undefined) {
    return resolveDynamicComponent('RouterLink');
  }

  return 'a';
});

const resolvedRel = computed(() => {
  if (props.item.rel) {
    return props.item.rel;
  }

  return props.item.target === '_blank' ? 'noopener noreferrer' : undefined;
});

const showsExternalLinkIcon = computed(() => isLink.value && props.item.target === '_blank');

const linkProps = computed(() => {
  if (props.item.to !== undefined) {
    return {
      to: props.item.to,
      target: props.item.target,
      rel: resolvedRel.value,
    };
  }

  return {
    href: props.item.href,
    target: props.item.target,
    rel: resolvedRel.value,
  };
});

function openBranch() {
  if (!hasChildren.value || props.item.disabled) {
    return;
  }

  emit('openPathChange', currentPath.value);
}

function toggleBranch() {
  if (!hasChildren.value || props.item.disabled) {
    return;
  }

  if (isOpen.value) {
    emit('openPathChange', props.parentPath);
    return;
  }

  emit('openPathChange', currentPath.value);
}

function handleLeafClick(event?: MouseEvent) {
  if (props.item.disabled) {
    event?.preventDefault();
    return;
  }

  emit('select', props.item);
}

function hasDescendantValue(item: VfNavMenuItem, targetValue?: string): boolean {
  if (!targetValue || !item.children?.length) {
    return false;
  }

  return item.children.some((child) => child.value === targetValue || hasDescendantValue(child, targetValue));
}

function onBranchKeydown(event: KeyboardEvent) {
  if (!hasChildren.value) {
    return;
  }

  if (
    event.key === 'Enter' ||
    event.key === ' ' ||
    event.key === 'ArrowDown' ||
    (props.depth > 0 && event.key === 'ArrowRight')
  ) {
    event.preventDefault();
    openBranch();
    return;
  }

  if ((event.key === 'ArrowLeft' || event.key === 'Escape') && props.depth > 0) {
    event.preventDefault();
    emit('openPathChange', props.parentPath);
  }
}

function onPointerEnter() {
  if (!props.hoverEnabled) {
    return;
  }

  openBranch();
}
</script>

<template>
  <li
    class="vf-menu-bar__node"
    :class="[
      `vf-menu-bar__node--depth-${depth}`,
      hasChildren && 'vf-menu-bar__node--branch',
      isOpen && 'vf-menu-bar__node--open',
    ]"
    @mouseenter="onPointerEnter"
  >
    <div
      v-if="isGroup"
      class="vf-menu-bar__group"
      role="presentation"
      :style="{ '--vf-menu-bar-depth': String(depth) }"
    >
      {{ item.label }}
    </div>

    <button
      v-else-if="hasChildren"
      type="button"
      class="vf-menu-bar__item vf-menu-bar__item--branch"
      :class="[
        depth === 0 && 'vf-menu-bar__item--top',
        isAncestorActive && 'vf-menu-bar__item--ancestor-active',
        isOpen && 'vf-menu-bar__item--open',
      ]"
      :style="{ '--vf-menu-bar-depth': String(depth) }"
      :aria-expanded="isOpen"
      :aria-haspopup="'menu'"
      role="menuitem"
      :disabled="item.disabled"
      @click="toggleBranch"
      @keydown="onBranchKeydown"
    >
      <span class="vf-menu-bar__item-content">
        <span v-if="item.leadingIcon" class="vf-menu-bar__leading-icon" aria-hidden="true">
          <VueIconify :icon="item.leadingIcon" size="var(--vf-icon-size-md)" />
        </span>
        <span class="vf-menu-bar__label">{{ item.label }}</span>
      </span>
      <span class="vf-menu-bar__icon" aria-hidden="true">
        <VueIconify
          :icon="depth === 0 ? icons.chevronDown : isOpen ? icons.minus : icons.plus"
          size="var(--vf-icon-size-sm)"
        />
      </span>
    </button>

    <component
      :is="resolvedComponent"
      v-else-if="isLink"
      v-bind="linkProps"
      class="vf-menu-bar__item"
      :class="[
        depth === 0 && 'vf-menu-bar__item--top',
        isActive && 'vf-menu-bar__item--active',
        isAncestorActive && 'vf-menu-bar__item--ancestor-active',
        item.disabled && 'vf-menu-bar__item--disabled',
      ]"
      :style="{ '--vf-menu-bar-depth': String(depth) }"
      :aria-current="isActive ? 'page' : undefined"
      role="menuitem"
      @click="handleLeafClick"
    >
      <span class="vf-menu-bar__item-content">
        <span v-if="item.leadingIcon" class="vf-menu-bar__leading-icon" aria-hidden="true">
          <VueIconify :icon="item.leadingIcon" size="var(--vf-icon-size-md)" />
        </span>
        <span class="vf-menu-bar__label">{{ item.label }}</span>
      </span>
      <span v-if="showsExternalLinkIcon" class="vf-menu-bar__icon vf-menu-bar__icon--external" aria-hidden="true">
        <VueIconify :icon="icons.externalLink" size="var(--vf-icon-size-sm)" />
      </span>
    </component>

    <button
      v-else
      type="button"
      class="vf-menu-bar__item"
      :class="[
        depth === 0 && 'vf-menu-bar__item--top',
        isActive && 'vf-menu-bar__item--active',
        isAncestorActive && 'vf-menu-bar__item--ancestor-active',
        item.disabled && 'vf-menu-bar__item--disabled',
      ]"
      :style="{ '--vf-menu-bar-depth': String(depth) }"
      :aria-current="isActive ? 'page' : undefined"
      role="menuitem"
      :disabled="item.disabled"
      @click="handleLeafClick()"
    >
      <span class="vf-menu-bar__item-content">
        <span v-if="item.leadingIcon" class="vf-menu-bar__leading-icon" aria-hidden="true">
          <VueIconify :icon="item.leadingIcon" size="var(--vf-icon-size-md)" />
        </span>
        <span class="vf-menu-bar__label">{{ item.label }}</span>
      </span>
    </button>

    <Transition name="vf-floating-transition" appear>
      <div
        v-if="hasChildren && isOpen"
        class="vf-menu-bar__submenu"
        :class="depth === 0 ? 'vf-menu-bar__submenu--root' : 'vf-menu-bar__submenu--nested'"
      >
        <ul class="vf-menu-bar__submenu-list" role="menu">
          <VfMenuBarItemNode
            v-for="child in item.children"
            :key="child.value"
            :item="child"
            :depth="depth + 1"
            :parent-path="currentPath"
            :active-value="activeValue"
            :open-path="openPath"
            :hover-enabled="true"
            @open-path-change="emit('openPathChange', $event)"
            @select="emit('select', $event)"
          />
        </ul>
      </div>
    </Transition>
  </li>
</template>
