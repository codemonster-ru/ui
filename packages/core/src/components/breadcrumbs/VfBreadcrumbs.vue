<script setup lang="ts">
import { computed, resolveDynamicComponent, useAttrs } from 'vue';
import type { Component } from 'vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
import { cx } from '@/utils/classes';
import type { VfBreadcrumbItem } from '@/types/components';

defineOptions({
  inheritAttrs: false,
});

interface VfBreadcrumbsProps {
  items: VfBreadcrumbItem[];
  ariaLabel?: string;
  component?: string | Component;
}

const props = withDefaults(defineProps<VfBreadcrumbsProps>(), {
  ariaLabel: 'Breadcrumb',
  component: undefined,
});

const attrs = useAttrs();
const rootClasses = computed(() => cx('vf-breadcrumbs', attrs.class as string | undefined));

const rootAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'class')));

const hasExplicitCurrent = computed(() => props.items.some((item) => item.current));

function isCurrent(item: VfBreadcrumbItem, index: number) {
  return item.current || (!hasExplicitCurrent.value && index === props.items.length - 1);
}

function isLink(item: VfBreadcrumbItem, index: number) {
  return !item.disabled && !isCurrent(item, index) && (item.href || item.to);
}

function resolvedRel(item: VfBreadcrumbItem) {
  if (item.rel) {
    return item.rel;
  }

  return item.target === '_blank' ? 'noopener noreferrer' : undefined;
}

function resolvedComponent(item: VfBreadcrumbItem) {
  if (item.to !== undefined) {
    return props.component ?? resolveDynamicComponent('RouterLink');
  }

  return 'a';
}

function itemProps(item: VfBreadcrumbItem) {
  if (item.to !== undefined) {
    return {
      to: item.to,
      target: item.target,
      rel: resolvedRel(item),
    };
  }

  return {
    href: item.href,
    target: item.target,
    rel: resolvedRel(item),
  };
}
</script>

<template>
  <nav :class="rootClasses" :aria-label="props.ariaLabel" v-bind="rootAttrs">
    <ol class="vf-breadcrumbs__list">
      <li v-for="(item, index) in props.items" :key="`${item.label}-${index}`" class="vf-breadcrumbs__item">
        <component
          :is="resolvedComponent(item)"
          v-if="isLink(item, index)"
          v-bind="itemProps(item)"
          class="vf-breadcrumbs__link"
        >
          {{ item.label }}
        </component>

        <span
          v-else
          class="vf-breadcrumbs__current"
          :class="item.disabled && 'vf-breadcrumbs__current--disabled'"
          :aria-current="isCurrent(item, index) ? 'page' : undefined"
        >
          {{ item.label }}
        </span>

        <span v-if="index < props.items.length - 1" class="vf-breadcrumbs__separator" aria-hidden="true">
          <VueIconify :icon="icons.chevronRight" size="var(--vf-icon-size-sm)" />
        </span>
      </li>
    </ol>
  </nav>
</template>
