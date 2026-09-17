<script setup lang="ts">
import { computed, resolveDynamicComponent, useAttrs } from 'vue';
import type { Component } from 'vue';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
import {
  isBreadcrumbLink,
  resolveBreadcrumbCurrentFlags,
  resolveBreadcrumbItemClasses,
  resolveLinkRel,
} from '@codemonster-ru/vueforge-shared-core';
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

// Which items are current is a shared rule: explicit flags if any, else the
// last item. It is read per index below, in the order the items render.
const currentFlags = computed(() => resolveBreadcrumbCurrentFlags(props.items.map((item) => item.current)));

function isCurrent(index: number) {
  return currentFlags.value[index] ?? false;
}

// The link test is the shared rule with the reference's own operand: `href ||
// to`, tested for truthiness. What `to` *is* stays this adapter's business -
// the rule only sees that it is truthy.
function isLink(item: VfBreadcrumbItem, index: number) {
  return isBreadcrumbLink(item.disabled, isCurrent(index), item.href || item.to);
}

// The rel rule is VfLink's, unchanged: the reference's inline function was the
// same test, and a breadcrumb-specific copy would only be a place to drift.
function resolvedRel(item: VfBreadcrumbItem) {
  return resolveLinkRel(item.rel, item.target);
}

// The router branch is this adapter's own. `to` selects it per item, the
// component is resolved by the name a Vue application registers, and nothing
// here reads a route: the destination is handed over untouched, and with
// nothing registered Vue renders a literal unresolved element. The shared rules
// above know nothing about any of this, which is what keeps the Razor adapter
// from needing to.
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

function currentClasses(item: VfBreadcrumbItem) {
  return cx(...resolveBreadcrumbItemClasses(item.disabled));
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

        <span v-else :class="currentClasses(item)" :aria-current="isCurrent(index) ? 'page' : undefined">
          {{ item.label }}
        </span>

        <span v-if="index < props.items.length - 1" class="vf-breadcrumbs__separator" aria-hidden="true">
          <slot name="separator" :item="item" :index="index">
            <VueIconify :icon="icons.chevronRight" size="var(--vf-icon-size-sm)" />
          </slot>
        </span>
      </li>
    </ol>
  </nav>
</template>
