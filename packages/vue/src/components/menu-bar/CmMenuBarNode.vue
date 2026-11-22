<script setup lang="ts">
import { externalLink } from '@codemonster-ru/ui-icons/controls';
import { attachCmMenuBarSubmenuPosition } from '@codemonster-ru/ui-runtime/anchored-position';
import { computed, resolveComponent, useId, useTemplateRef, watchEffect, type Component, type PropType } from 'vue';

import { useCmFloatingPaint } from '../../internal/floating-paint';
import CmIcon from '../icon/CmIcon.vue';
import type { CmMenuBarItem } from './menu-bar.types';

// Recursion needs its own component; every rule it renders from is resolved by the parent.
defineOptions({ name: 'CmMenuBarNode' });
const props = defineProps({
  item: { type: Object as PropType<CmMenuBarItem>, required: true },
  depth: { type: Number, required: true },
  openPath: { type: Array as PropType<readonly string[]>, required: true },
  activeValue: { type: String as PropType<string | null>, default: null },
  activeBranch: { type: String, default: undefined },
  tabbableValue: { type: String as PropType<string | null>, default: null },
  linkComponent: { type: [String, Object, Function] as PropType<string | Component>, default: undefined },
  submenuTarget: { type: Object as PropType<HTMLElement>, default: undefined },
});
const emit = defineEmits<{ toggle: [value: string]; select: [value: string] }>();
const panelId = useId();

defineSlots<Record<string, (scope: { item: CmMenuBarItem }) => unknown>>();

const itemSlot = computed(
  () =>
    `item${props.item.value
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')}`,
);
const isGroup = computed(() => props.item.kind === 'group');
const hasChildren = computed(() => !isGroup.value && (props.item.children?.length ?? 0) > 0);
const isOpen = computed(() => props.openPath.includes(props.item.value));
const branch = useTemplateRef<HTMLButtonElement>('branch');
const submenu = useTemplateRef<HTMLUListElement>('submenu');
const painted = useCmFloatingPaint(isOpen, submenu);

watchEffect(
  (onCleanup) => {
    // The historical wrapper positions its teleported top-level submenus.
    if (!painted.value || !branch.value || !submenu.value || props.submenuTarget) return;
    onCleanup(attachCmMenuBarSubmenuPosition(branch.value, submenu.value, props.depth === 0));
  },
  { flush: 'post' },
);

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
  hasChildren.value && props.activeBranch === props.item.value ? 'cm-menu-bar__item--ancestor-active' : undefined,
  isActive.value ? 'cm-menu-bar__item--active' : undefined,
]);
const depthStyle = computed(() => ({ '--cm-menu-bar-depth': String(props.depth) }));
const isLink = computed(() => Boolean(props.item.href) || props.item.to !== undefined);
const destination = computed(() => {
  if (!isLink.value) return { type: 'button' };
  if (props.item.disabled) return {};
  return {
    ...(props.item.to === undefined ? { href: props.item.href } : { to: props.item.to }),
    target: props.item.target,
    rel: props.item.rel ?? (props.item.target === '_blank' ? 'noopener noreferrer' : undefined),
  };
});

function leafElement(): string | Component {
  if (!isLink.value) return 'button';
  if (props.item.disabled || props.item.to === undefined) return 'a';
  return props.linkComponent ?? resolveComponent('RouterLink');
}

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
    <template v-if="isGroup">
      <span class="cm-menu-bar__group-label" aria-hidden="true">{{ props.item.label }}</span>
      <ul
        v-if="props.item.children?.length"
        class="cm-menu-bar__group-list"
        role="group"
        :aria-label="props.item.label"
      >
        <CmMenuBarNode
          v-for="child in props.item.children"
          :key="child.value"
          :item="child"
          :depth="props.depth"
          :open-path="props.openPath"
          :active-value="activeValue"
          :active-branch="props.activeBranch"
          :tabbable-value="tabbableValue"
          :link-component="props.linkComponent"
          :submenu-target="props.submenuTarget"
          @toggle="$emit('toggle', $event)"
          @select="$emit('select', $event)"
        >
          <template v-for="name in Object.keys($slots)" #[name]="scope">
            <slot :name="name" v-bind="scope" />
          </template>
        </CmMenuBarNode>
      </ul>
    </template>
    <button
      v-else-if="hasChildren"
      ref="branch"
      :class="itemClasses"
      type="button"
      role="menuitem"
      :style="depthStyle"
      :data-cm-menu-bar-branch="props.item.value"
      aria-haspopup="menu"
      :aria-controls="props.submenuTarget ? panelId : undefined"
      :aria-expanded="isOpen"
      :tabindex="tabindex"
      :disabled="props.item.disabled || undefined"
      @click="$emit('toggle', props.item.value)"
    >
      <CmIcon v-if="props.item.leadingIcon" :icon="props.item.leadingIcon" :size="'var(--cm-icon-size-sm)'" />
      <slot :name="itemSlot" :item="props.item"
        ><span class="cm-menu-bar__label">{{ props.item.label }}</span></slot
      ><span class="cm-menu-bar__icon" aria-hidden="true"></span>
    </button>
    <component
      :is="leafElement()"
      v-else
      v-bind="destination"
      :class="itemClasses"
      role="menuitem"
      :style="depthStyle"
      :data-cm-menu-bar-value="props.item.value"
      :aria-current="isActive ? 'page' : undefined"
      :aria-disabled="isLink && props.item.disabled ? 'true' : undefined"
      :tabindex="tabindex"
      :disabled="!isLink && props.item.disabled ? true : undefined"
      @click="select"
    >
      <CmIcon v-if="props.item.leadingIcon" :icon="props.item.leadingIcon" :size="'var(--cm-icon-size-sm)'" />
      <slot :name="itemSlot" :item="props.item"
        ><span class="cm-menu-bar__label">{{ props.item.label }}</span></slot
      >
      <CmIcon v-if="isLink && props.item.target === '_blank'" :icon="externalLink" size="var(--cm-icon-size-sm)" />
    </component>
    <Teleport v-if="hasChildren" :to="props.submenuTarget ?? 'body'" :disabled="!props.submenuTarget">
      <ul
        ref="submenu"
        :id="props.submenuTarget ? panelId : undefined"
        class="cm-menu-bar__submenu"
        role="menu"
        :aria-label="props.item.label"
        :hidden="!isOpen"
      >
        <CmMenuBarNode
          v-for="child in props.item.children"
          :key="child.value"
          :item="child"
          :depth="props.depth + 1"
          :open-path="props.openPath"
          :active-value="activeValue"
          :tabbable-value="tabbableValue"
          :link-component="props.linkComponent"
          @toggle="$emit('toggle', $event)"
          @select="$emit('select', $event)"
        >
          <template v-for="name in Object.keys($slots)" #[name]="scope">
            <slot :name="name" v-bind="scope" />
          </template>
        </CmMenuBarNode>
      </ul>
    </Teleport>
  </li>
</template>
