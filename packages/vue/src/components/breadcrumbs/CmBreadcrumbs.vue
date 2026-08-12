<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs, type CmClassValue } from '../../internal/root-attributes';
import type { CmBreadcrumbItem } from './breadcrumbs.types';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  items: { type: Array as PropType<readonly CmBreadcrumbItem[]>, required: true },
  ariaLabel: { type: String, default: 'Breadcrumb' },
});
const attrs = useAttrs();
const classes = computed(() => mergeCmClasses('cm-breadcrumbs', attrs.class as CmClassValue));
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['aria-label']));
const normalizedItems = computed(() => {
  if (props.items.length === 0 || !props.ariaLabel.trim() || props.items.filter(({ current }) => current).length > 1) {
    throw new TypeError('Breadcrumbs require items, one optional current item, and a non-empty accessible label.');
  }
  for (const item of props.items) {
    if (!item.label.trim() || (item.href !== undefined && !item.href.trim())) {
      throw new TypeError('Invalid Breadcrumb item.');
    }
  }
  return props.items;
});
const hasCurrent = computed(() => normalizedItems.value.some(({ current }) => current));

function current(item: CmBreadcrumbItem, index: number): boolean {
  return Boolean(item.current) || (!hasCurrent.value && index === normalizedItems.value.length - 1);
}
</script>

<template>
  <nav v-bind="rootAttrs" :class="classes" :aria-label="props.ariaLabel">
    <ol class="cm-breadcrumbs__list">
      <li v-for="(item, index) in normalizedItems" :key="`${item.label}-${index}`" class="cm-breadcrumbs__item">
        <a v-if="!item.disabled && !current(item, index) && item.href" class="cm-breadcrumbs__link" :href="item.href">
          {{ item.label }}
        </a>
        <span
          v-else
          class="cm-breadcrumbs__current"
          :class="item.disabled ? 'cm-breadcrumbs__current--disabled' : undefined"
          :aria-current="current(item, index) ? 'page' : undefined"
        >
          {{ item.label }}
        </span>
        <span v-if="index < normalizedItems.length - 1" class="cm-breadcrumbs__separator" aria-hidden="true">
          <slot name="separator">/</slot>
        </span>
      </li>
    </ol>
  </nav>
</template>
