<script setup lang="ts">
import { computed, resolveDynamicComponent } from 'vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
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
const isAncestorActive = computed(() => !isActive.value && hasDescendantValue(props.item, props.activeValue));
const isLink = computed(() => props.item.href !== undefined || props.item.to !== undefined);
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

function hasDescendantValue(item: VfNavMenuItem, targetValue?: string): boolean {
  if (!targetValue || !item.children?.length) {
    return false;
  }

  return item.children.some((child) => child.value === targetValue || hasDescendantValue(child, targetValue));
}

function setNestedListTransition(element: Element) {
  const target = element as HTMLElement;
  target.style.transition =
    'height var(--vf-motion-duration-normal) var(--vf-motion-ease-standard), opacity var(--vf-motion-duration-normal) var(--vf-motion-ease-standard)';

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
  <li class="vf-nav-menu__node">
    <div
      v-if="isGroup"
      :class="['vf-nav-menu__group', `vf-nav-menu__group--level-${level}`]"
      :style="{ '--vf-nav-menu-level': String(level) }"
    >
      <span class="vf-nav-menu__item-content">
        <span class="vf-nav-menu__group-label">{{ item.label }}</span>
      </span>
    </div>

    <button
      v-else-if="hasChildren"
      :class="[
        'vf-nav-menu__item',
        'vf-nav-menu__item--branch',
        level === 0 && 'vf-nav-menu__item--top',
        !item.leadingIcon && 'vf-nav-menu__item--icon-offset',
        isAncestorActive && 'vf-nav-menu__item--ancestor-active',
        isExpanded && 'vf-nav-menu__item--expanded',
      ]"
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
      <span :class="['vf-nav-menu__icon', isExpanded && 'vf-nav-menu__icon--open']" aria-hidden="true">
        <VueIconify :icon="icons.chevronDown" size="var(--vf-icon-size-sm)" />
      </span>
    </button>

    <component
      :is="resolvedComponent"
      v-else-if="isLink"
      v-bind="linkProps"
      :class="[
        'vf-nav-menu__item',
        level === 0 && 'vf-nav-menu__item--top',
        !item.leadingIcon && 'vf-nav-menu__item--icon-offset',
        isActive && 'vf-nav-menu__item--active',
        isAncestorActive && 'vf-nav-menu__item--ancestor-active',
        item.disabled && 'vf-nav-menu__item--disabled',
      ]"
      :style="{ '--vf-nav-menu-level': String(level) }"
      :aria-current="isActive ? 'page' : undefined"
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
      :class="[
        'vf-nav-menu__item',
        level === 0 && 'vf-nav-menu__item--top',
        !item.leadingIcon && 'vf-nav-menu__item--icon-offset',
        isActive && 'vf-nav-menu__item--active',
        isAncestorActive && 'vf-nav-menu__item--ancestor-active',
        item.disabled && 'vf-nav-menu__item--disabled',
      ]"
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
      <div v-if="isExpanded" :class="['vf-nav-menu__collapse', `vf-nav-menu__collapse--level-${level}`]">
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
