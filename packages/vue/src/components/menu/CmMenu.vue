<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
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
  if (props.items.length === 0) throw new TypeError('Menu requires items.');
  const ids = new Set<string>();
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
      throw new TypeError(`Invalid Menu item: ${item.id}.`);
    }
    ids.add(item.id);
  }
  if (!props.items.some(({ disabled }) => !disabled)) throw new TypeError('Menu requires an enabled item.');
  return props.items;
});
const classes = computed(() => mergeCmClasses('cm-menu', attrs.class as CmClassValue));
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
  if (event.key === 'Escape') {
    event.preventDefault();
    emit('closeRequest');
    return;
  }
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
  const root = event.currentTarget as HTMLElement;
  const enabled = [
    ...root.querySelectorAll<HTMLElement>('[data-cm-menu-item]:not([disabled]):not([aria-disabled="true"])'),
  ];
  const index = enabled.indexOf(event.target as HTMLElement);
  if (index < 0) return;
  event.preventDefault();
  const last = enabled.length - 1;
  const nextIndex =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? last
        : event.key === 'ArrowDown'
          ? (index + 1) % enabled.length
          : (index - 1 + enabled.length) % enabled.length;
  enabled[nextIndex]?.focus();
}
</script>

<template>
  <div v-bind="rootAttrs" :class="classes" role="menu" :aria-label="label" data-cm-controller="menu" @keydown="move">
    <component
      :is="item.href ? 'a' : 'button'"
      v-for="(item, index) in normalizedItems"
      :key="item.id"
      :class="itemClasses(item)"
      :type="item.href ? undefined : 'button'"
      :href="item.href && !item.disabled ? item.href : undefined"
      :target="item.href ? item.target : undefined"
      :rel="item.href ? itemRel(item) : undefined"
      role="menuitem"
      :tabindex="!item.disabled && normalizedItems.findIndex((candidate) => !candidate.disabled) === index ? 0 : -1"
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
