<script setup lang="ts">
import { computed, resolveDynamicComponent } from 'vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
import {
  NAV_MENU_COLLAPSE_TRANSITION,
  resolveLinkRel,
  resolveNavMenuBranchClasses,
  resolveNavMenuCollapseClasses,
  resolveNavMenuGroupClasses,
  resolveNavMenuHasDescendant,
  resolveNavMenuIconClasses,
  resolveNavMenuIsLink,
  resolveNavMenuLeafClasses,
  resolveNavMenuNodeClasses,
  resolveNavMenuShowsExternalIcon,
} from '@codemonster-ru/vueforge-shared-core';
import type { VfNavMenuItem } from '@/types/components';

defineOptions({
  name: 'VfNavMenuItemNode',
});

const props = defineProps<{
  item: VfNavMenuItem;
  level: number;
  parentPath: string[];
  activeValue?: string;
  expandedValues: string[];
}>();

const emit = defineEmits<{
  toggle: [payload: { value: string; parentPath: string[] }];
  select: [item: VfNavMenuItem];
}>();

const hasChildren = computed(() => Boolean(props.item.children?.length));
const isGroup = computed(() => props.item.kind === 'group');
const isExpanded = computed(() => props.expandedValues.includes(props.item.value));
const isActive = computed(() => props.activeValue === props.item.value);
const isAncestorActive = computed(() => !isActive.value && resolveNavMenuHasDescendant(props.item, props.activeValue));
const isLink = computed(() => resolveNavMenuIsLink(props.item));
const resolvedComponent = computed(() => {
  if (props.item.to !== undefined) {
    return resolveDynamicComponent('RouterLink');
  }

  return 'a';
});

// VfLink's rule, which the reference wrote out again here character for character.
const resolvedRel = computed(() => resolveLinkRel(props.item.rel, props.item.target));

const showsExternalLinkIcon = computed(() => resolveNavMenuShowsExternalIcon(props.item));

// The class lists are shared with the Razor adapter; see
// packages/shared-core/src/nav-menu/state.ts.
const hasLeadingIcon = computed(() => Boolean(props.item.leadingIcon));
const nodeClasses = computed(() =>
  resolveNavMenuNodeClasses({
    level: props.level,
    expanded: isExpanded.value,
    active: isActive.value,
    ancestorActive: isAncestorActive.value,
  }),
);
const branchClasses = computed(() =>
  resolveNavMenuBranchClasses({
    level: props.level,
    hasLeadingIcon: hasLeadingIcon.value,
    ancestorActive: isAncestorActive.value,
    expanded: isExpanded.value,
  }),
);
const leafClasses = computed(() =>
  resolveNavMenuLeafClasses({
    level: props.level,
    hasLeadingIcon: hasLeadingIcon.value,
    active: isActive.value,
    ancestorActive: isAncestorActive.value,
    disabled: Boolean(props.item.disabled),
  }),
);

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

function onBranchClick() {
  if (props.item.disabled) {
    return;
  }

  emit('toggle', {
    value: props.item.value,
    parentPath: props.parentPath,
  });
}

function onLeafClick(event?: MouseEvent) {
  if (props.item.disabled) {
    event?.preventDefault();
    return;
  }

  emit('select', props.item);
}

function setNestedListTransition(element: Element) {
  const target = element as HTMLElement;
  target.style.transition = NAV_MENU_COLLAPSE_TRANSITION;

  return target;
}

function onNestedListBeforeEnter(element: Element) {
  const target = setNestedListTransition(element);
  target.style.overflow = 'hidden';
  target.style.height = '0';
  target.style.opacity = '0';
}

function onNestedListEnter(element: Element) {
  const target = setNestedListTransition(element);
  requestAnimationFrame(() => {
    target.style.height = `${target.scrollHeight}px`;
    target.style.opacity = '1';
  });
}

function onNestedListAfterEnter(element: Element) {
  const target = element as HTMLElement;
  target.style.transition = '';
  target.style.overflow = '';
  target.style.height = '';
  target.style.opacity = '';
}

function onNestedListBeforeLeave(element: Element) {
  const target = setNestedListTransition(element);
  target.style.overflow = 'hidden';
  target.style.height = `${target.scrollHeight}px`;
  target.style.opacity = '1';
}

function onNestedListLeave(element: Element) {
  const target = element as HTMLElement;
  void target.offsetHeight;
  requestAnimationFrame(() => {
    target.style.height = '0';
    target.style.opacity = '0';
  });
}

function onNestedListAfterLeave(element: Element) {
  const target = element as HTMLElement;
  target.style.transition = '';
  target.style.overflow = '';
  target.style.height = '';
  target.style.opacity = '';
}
</script>

<template>
  <li :class="nodeClasses">
    <div v-if="isGroup" :class="resolveNavMenuGroupClasses(level)" :style="{ '--vf-nav-menu-level': String(level) }">
      <span class="vf-nav-menu__item-content">
        <span class="vf-nav-menu__group-label">{{ item.label }}</span>
      </span>
    </div>

    <button
      v-else-if="hasChildren"
      :class="branchClasses"
      :style="{ '--vf-nav-menu-level': String(level) }"
      :aria-expanded="isExpanded"
      :disabled="item.disabled"
      type="button"
      @click="onBranchClick"
    >
      <span class="vf-nav-menu__item-content">
        <span v-if="item.leadingIcon" class="vf-nav-menu__leading-icon" aria-hidden="true">
          <VueIconify :icon="item.leadingIcon" size="var(--vf-icon-size-md)" />
        </span>
        <span class="vf-nav-menu__label">{{ item.label }}</span>
      </span>
      <span :class="resolveNavMenuIconClasses(isExpanded)" aria-hidden="true">
        <VueIconify :icon="icons.chevronDown" size="var(--vf-icon-size-sm)" />
      </span>
    </button>

    <component
      :is="resolvedComponent"
      v-else-if="isLink"
      v-bind="linkProps"
      :class="leafClasses"
      :style="{ '--vf-nav-menu-level': String(level) }"
      :aria-current="isActive ? 'page' : undefined"
      :aria-disabled="item.disabled || undefined"
      :tabindex="item.disabled ? -1 : undefined"
      @click="onLeafClick"
    >
      <span class="vf-nav-menu__item-content">
        <span v-if="item.leadingIcon" class="vf-nav-menu__leading-icon" aria-hidden="true">
          <VueIconify :icon="item.leadingIcon" size="var(--vf-icon-size-md)" />
        </span>
        <span class="vf-nav-menu__label">{{ item.label }}</span>
      </span>
      <span v-if="showsExternalLinkIcon" class="vf-nav-menu__icon vf-nav-menu__icon--external" aria-hidden="true">
        <VueIconify :icon="icons.externalLink" size="var(--vf-icon-size-sm)" />
      </span>
    </component>

    <button
      v-else
      :class="leafClasses"
      :style="{ '--vf-nav-menu-level': String(level) }"
      :aria-current="isActive ? 'page' : undefined"
      :disabled="item.disabled"
      type="button"
      @click="onLeafClick()"
    >
      <span class="vf-nav-menu__item-content">
        <span v-if="item.leadingIcon" class="vf-nav-menu__leading-icon" aria-hidden="true">
          <VueIconify :icon="item.leadingIcon" size="var(--vf-icon-size-md)" />
        </span>
        <span class="vf-nav-menu__label">{{ item.label }}</span>
      </span>
    </button>

    <ul v-if="hasChildren && isGroup" class="vf-nav-menu__list vf-nav-menu__list--nested">
      <VfNavMenuItemNode
        v-for="child in item.children"
        :key="child.value"
        :item="child"
        :level="level + 1"
        :parent-path="[...parentPath, item.value]"
        :active-value="activeValue"
        :expanded-values="expandedValues"
        @toggle="emit('toggle', $event)"
        @select="emit('select', $event)"
      />
    </ul>

    <Transition
      v-else-if="hasChildren"
      @before-enter="onNestedListBeforeEnter"
      @enter="onNestedListEnter"
      @after-enter="onNestedListAfterEnter"
      @before-leave="onNestedListBeforeLeave"
      @leave="onNestedListLeave"
      @after-leave="onNestedListAfterLeave"
    >
      <div v-if="isExpanded" :class="resolveNavMenuCollapseClasses(level)">
        <ul class="vf-nav-menu__list vf-nav-menu__list--nested">
          <VfNavMenuItemNode
            v-for="child in item.children"
            :key="child.value"
            :item="child"
            :level="level + 1"
            :parent-path="[...parentPath, item.value]"
            :active-value="activeValue"
            :expanded-values="expandedValues"
            @toggle="emit('toggle', $event)"
            @select="emit('select', $event)"
          />
        </ul>
      </div>
    </Transition>
  </li>
</template>
