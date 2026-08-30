<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import { useCmHydrated } from '../../internal/hydration';
import { isMenuCloseKey, menuTabStopId, nextMenuItem } from '@codemonster-ru/ui-runtime/core';
import { assertCm, warnCm } from '../../internal/warn';
import type { CmMenuItem } from './menu.types';

defineOptions({ inheritAttrs: false });

const idPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;
const props = defineProps({
  items: { type: Array as PropType<readonly CmMenuItem[]>, required: true },
  ariaLabel: { type: String, default: 'Actions' },
});
const emit = defineEmits<{
  closeRequest: [];
  select: [value: string];
}>();
const attrs = useAttrs();
const normalizedItems = computed(() => {
  assertCm(props.items.length > 0, 'Menu requires items.');
  const ids = new Set<string>();
  const items: CmMenuItem[] = [];
  for (const item of props.items) {
    if (
      !idPattern.test(item.id) ||
      !item.label.trim() ||
      (item.href !== undefined && !item.href.trim()) ||
      (item.target !== undefined && !item.target.trim()) ||
      (item.rel !== undefined && !item.rel.trim()) ||
      (item.tone !== undefined && !['default', 'danger'].includes(item.tone)) ||
      ids.has(item.id)
    ) {
      warnCm(`Invalid Menu item: ${item.id}. The item is not rendered.`);
      continue;
    }
    ids.add(item.id);
    items.push(item);
  }
  assertCm(items.length === 0 || items.some(({ disabled }) => !disabled), 'Menu requires an enabled item.');
  return items;
});
const classes = computed(() => mergeCmClasses('cm-menu', attrs.class));
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['role', 'aria-label', 'data-cm-controller', 'onKeydown']));
const label = computed(() => (attrs['aria-labelledby'] === undefined ? props.ariaLabel : undefined));

function itemClasses(item: CmMenuItem): string {
  return mergeCmClasses(
    'cm-menu__item',
    item.active ? 'cm-menu__item--active' : undefined,
    item.tone === 'danger' ? 'cm-menu__item--danger' : undefined,
  );
}

function itemSlotName(id: string): string {
  return `item${id
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('')}`;
}

function itemRel(item: CmMenuItem): string | undefined {
  return item.rel ?? (item.target === '_blank' ? 'noopener noreferrer' : undefined);
}

function activate(event: MouseEvent, item: CmMenuItem): void {
  if (item.disabled) {
    event.preventDefault();
    return;
  }
  emit('select', item.id);
}

function move(event: KeyboardEvent): void {
  if (isMenuCloseKey(event.key)) {
    event.preventDefault();
    emit('closeRequest');
    return;
  }
  const root = event.currentTarget as HTMLElement;
  const currentId = (event.target as HTMLElement).closest<HTMLElement>('[data-cm-menu-item]')?.dataset.cmMenuValue;
  if (currentId === undefined) return;

  const nextId = nextMenuItem(normalizedItems.value, currentId, event.key);
  if (nextId === null) return;

  event.preventDefault();
  root.querySelector<HTMLElement>(`[data-cm-menu-value="${nextId}"]`)?.focus();
}

const tabStopId = computed(() => menuTabStopId(normalizedItems.value));

useCmHydrated();
</script>

<template>
  <div v-bind="rootAttrs" :class="classes" role="menu" :aria-label="label" data-cm-controller="menu" @keydown="move">
    <component
      :is="item.href ? 'a' : 'button'"
      v-for="item in normalizedItems"
      :key="item.id"
      :class="itemClasses(item)"
      :type="item.href ? undefined : 'button'"
      :href="item.href && !item.disabled ? item.href : undefined"
      :target="item.href ? item.target : undefined"
      :rel="item.href ? itemRel(item) : undefined"
      role="menuitem"
      :tabindex="item.id === tabStopId ? 0 : -1"
      data-cm-menu-item
      :data-cm-menu-value="item.id"
      :disabled="!item.href && item.disabled ? true : undefined"
      :aria-disabled="item.href && item.disabled ? 'true' : undefined"
      :aria-current="item.active ? 'true' : undefined"
      @click="activate($event, item)"
    >
      <span class="cm-menu__item-label">
        <slot :name="itemSlotName(item.id)" :item="item">{{ item.label }}</slot>
      </span>
    </component>
  </div>
</template>
