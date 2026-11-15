<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, type PropType } from 'vue';

import {
  needsScrollEnhancement,
  resolveAnchorTargetId,
  resolveHeadingLevel,
  resolveItemHref,
  resolveScrollTarget,
} from '@codemonster-ru/ui-runtime/core';
import { useCmHydrated } from '../../internal/hydration';
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
const root = ref<HTMLElement>();
const scrollOffset = computed(() => (Number.isFinite(props.scrollOffset) ? props.scrollOffset : 0));
const enhance = computed(() => needsScrollEnhancement(props.smooth, scrollOffset.value));
let initialScroll: number | undefined;

const variant = computed(() => (props.variant === 'pills' ? 'pills' : 'default'));
const classes = computed(() =>
  mergeCmClasses(
    'cm-table-of-contents',
    variant.value === 'default' ? undefined : `cm-table-of-contents--${variant.value}`,
    attrs.class,
  ),
);
const rootAttrs = computed(() =>
  omitCmOwnedAttrs(attrs, [
    'class',
    'aria-label',
    'data-cm-controller',
    'data-cm-toc-smooth',
    'data-cm-toc-scroll-offset',
  ]),
);

function itemHref(item: CmTableOfContentsItem): string {
  return resolveItemHref(item);
}

function levelStyle(item: CmTableOfContentsItem): Record<string, string> {
  return { '--cm-toc-level': String(resolveHeadingLevel(item.level)) };
}

function onLinkClick(event: MouseEvent, item: CmTableOfContentsItem): void {
  if (!enhance.value) return;
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  ) {
    return;
  }

  const href = itemHref(item);
  const targetId = resolveAnchorTargetId(href);
  if (targetId === null) return;

  const ownerDocument = root.value?.ownerDocument;
  const view = ownerDocument?.defaultView;
  const target = ownerDocument?.getElementById(targetId);
  if (!view || !target) return;

  event.preventDefault();
  cancelInitialScroll();
  if (view.location.hash !== href) view.history.pushState(null, '', href);
  scrollToTarget(target, true);
}

function initialTarget(): HTMLElement | null {
  if (!enhance.value) return null;
  const ownerDocument = root.value?.ownerDocument;
  if (!ownerDocument) return null;
  const id = resolveAnchorTargetId(ownerDocument.defaultView?.location.hash ?? '');
  if (id === null || !props.items.some((item) => resolveAnchorTargetId(itemHref(item)) === id)) return null;
  return ownerDocument.getElementById(id);
}

function cancelInitialScroll(): void {
  if (initialScroll === undefined) return;
  root.value?.ownerDocument.defaultView?.cancelAnimationFrame(initialScroll);
  initialScroll = undefined;
}

function scrollToTarget(target: HTMLElement, focus: boolean): void {
  const view = target.ownerDocument.defaultView;
  if (!view) return;
  const reduceMotion = view.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  if (focus) target.focus({ preventScroll: true });
  view.scrollTo({
    behavior: reduceMotion ? 'instant' : props.smooth ? 'smooth' : 'auto',
    top: resolveScrollTarget({
      scrollOffset: scrollOffset.value,
      scrollY: view.scrollY,
      targetTop: target.getBoundingClientRect().top,
    }),
  });
}

onMounted(() => {
  const view = root.value?.ownerDocument.defaultView;
  if (!view || !initialTarget()) return;
  initialScroll = view.requestAnimationFrame(() => {
    initialScroll = undefined;
    const target = initialTarget();
    if (target) scrollToTarget(target, false);
  });
});
onBeforeUnmount(cancelInitialScroll);
useCmHydrated();
</script>

<template>
  <nav
    ref="root"
    v-bind="rootAttrs"
    :class="classes"
    :aria-label="props.ariaLabel"
    :data-cm-controller="enhance ? 'table-of-contents' : undefined"
    :data-cm-toc-scroll-offset="enhance && scrollOffset !== 0 ? scrollOffset : undefined"
    :data-cm-toc-smooth="props.smooth ? '' : undefined"
  >
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
