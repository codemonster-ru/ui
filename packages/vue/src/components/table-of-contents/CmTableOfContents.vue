<script setup lang="ts">
import { computed, useAttrs, type PropType } from 'vue';

import {
  needsScrollEnhancement,
  resolveAnchorTargetId,
  resolveHeadingLevel,
  resolveItemHref,
  resolveScrollTarget,
} from '@codemonster-ru/ui-runtime/core';
import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import type { CmTableOfContentsItem, CmTableOfContentsVariant } from './table-of-contents.types';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  items: { type: Array as PropType<readonly CmTableOfContentsItem[]>, required: true },
  activeId: { type: String as PropType<string | null>, default: null },
  ariaLabel: { type: String, default: 'Table of contents' },
  smooth: Boolean,
  scrollOffset: { type: Number, default: 0 },
  variant: {
    type: String as PropType<CmTableOfContentsVariant>,
    default: 'default',
    validator: (value: string) => ['default', 'pills'].includes(value),
  },
});
const attrs = useAttrs();

const variant = computed(() => (props.variant === 'pills' ? 'pills' : 'default'));
const classes = computed(() =>
  mergeCmClasses(
    'cm-table-of-contents',
    variant.value === 'default' ? undefined : `cm-table-of-contents--${variant.value}`,
    attrs.class,
  ),
);
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, ['class', 'aria-label']));

function itemHref(item: CmTableOfContentsItem): string {
  return resolveItemHref(item);
}

function levelStyle(item: CmTableOfContentsItem): Record<string, string> {
  return { '--cm-toc-level': String(resolveHeadingLevel(item.level)) };
}

// Native anchor navigation is already correct without an offset or smooth behaviour, so the click
// is only intercepted when there is something the browser would get wrong.
function onLinkClick(event: MouseEvent, item: CmTableOfContentsItem): void {
  if (!needsScrollEnhancement(props.smooth, props.scrollOffset)) return;

  const href = itemHref(item);
  const targetId = resolveAnchorTargetId(href);
  if (targetId === null) return;

  const target = document.getElementById(targetId);
  if (!target) return;

  event.preventDefault();
  if (window.location.hash !== href) window.history.pushState(null, '', href);
  window.scrollTo({
    behavior: props.smooth ? 'smooth' : 'auto',
    top: resolveScrollTarget({
      scrollOffset: props.scrollOffset,
      scrollY: window.scrollY,
      targetTop: target.getBoundingClientRect().top,
    }),
  });
}
</script>

<template>
  <nav v-bind="rootAttrs" :class="classes" :aria-label="props.ariaLabel">
    <ol class="cm-table-of-contents__list">
      <li v-for="item in props.items" :key="item.id" class="cm-table-of-contents__item" :style="levelStyle(item)">
        <a
          :class="[
            'cm-table-of-contents__link',
            props.activeId === item.id ? 'cm-table-of-contents__link--active' : undefined,
          ]"
          :href="itemHref(item)"
          :aria-current="props.activeId === item.id ? 'location' : undefined"
          @click="onLinkClick($event, item)"
          >{{ item.label }}</a
        >
      </li>
    </ol>
  </nav>
</template>
