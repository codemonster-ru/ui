<script setup lang="ts">
import { computed, resolveDynamicComponent, useAttrs, type Component, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import { assertCm, warnCm } from '../../internal/warn';
import type { CmBreadcrumbItem } from './breadcrumbs.types';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  items: { type: Array as PropType<readonly CmBreadcrumbItem[]>, required: true },
  ariaLabel: { type: String, default: 'Breadcrumb' },
  component: { type: [String, Object, Function] as PropType<string | Component>, default: undefined },
});
const attrs = useAttrs();
const classes = computed(() => mergeCmClasses('cm-breadcrumbs', attrs.class));
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['aria-label']));
const normalizedItems = computed(() => {
  assertCm(
    props.items.length > 0 && props.ariaLabel.trim() !== '',
    'Breadcrumbs require items and a non-empty accessible label.',
  );

  const items: CmBreadcrumbItem[] = [];
  let markedCurrent = false;
  for (const item of props.items) {
    if (!item.label.trim() || (item.href !== undefined && !item.href.trim())) {
      warnCm('Invalid Breadcrumb item. The item is not rendered.');
      continue;
    }
    if (item.current && markedCurrent) {
      warnCm('Breadcrumbs accept one current item. The later flag is ignored.');
      items.push({ ...item, current: false });
      continue;
    }
    markedCurrent = markedCurrent || Boolean(item.current);
    items.push(item);
  }
  return items;
});
const hasCurrent = computed(() => normalizedItems.value.some(({ current }) => current));

function current(item: CmBreadcrumbItem, index: number): boolean {
  return Boolean(item.current) || (!hasCurrent.value && index === normalizedItems.value.length - 1);
}

function itemLink(item: CmBreadcrumbItem) {
  return item.to === undefined ? 'a' : (props.component ?? resolveDynamicComponent('RouterLink'));
}

function itemLinkAttrs(item: CmBreadcrumbItem) {
  return {
    ...(item.to === undefined ? { href: item.href } : { to: item.to }),
    target: item.target,
    rel: item.rel ?? (item.target === '_blank' ? 'noopener noreferrer' : undefined),
  };
}
</script>

<template>
  <nav v-bind="rootAttrs" :class="classes" :aria-label="props.ariaLabel">
    <ol class="cm-breadcrumbs__list">
      <li v-for="(item, index) in normalizedItems" :key="`${item.label}-${index}`" class="cm-breadcrumbs__item">
        <component
          :is="itemLink(item)"
          v-if="!item.disabled && !current(item, index) && (item.href || item.to)"
          v-bind="itemLinkAttrs(item)"
          class="cm-breadcrumbs__link"
        >
          {{ item.label }}
        </component>
        <span
          v-else
          class="cm-breadcrumbs__current"
          :class="item.disabled ? 'cm-breadcrumbs__current--disabled' : undefined"
          :aria-current="current(item, index) ? 'page' : undefined"
        >
          {{ item.label }}
        </span>
        <span v-if="index < normalizedItems.length - 1" class="cm-breadcrumbs__separator" aria-hidden="true">
          <slot name="separator" :item="item" :index="index">/</slot>
        </span>
      </li>
    </ol>
  </nav>
</template>
