<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useAttrs, type StyleValue } from 'vue';
import { cx } from '@/utils/classes';
import type { VfTableOfContentsItem } from '@/types/components';

defineOptions({
  inheritAttrs: false,
});

interface VfTableOfContentsProps {
  items: VfTableOfContentsItem[];
  activeId?: string;
  ariaLabel?: string;
  smooth?: boolean;
  scrollOffset?: number;
  variant?: 'default' | 'pills';
}

const props = withDefaults(defineProps<VfTableOfContentsProps>(), {
  activeId: undefined,
  ariaLabel: 'Table of contents',
  smooth: false,
  scrollOffset: 0,
  variant: 'default',
});

const attrs = useAttrs();
const isReady = ref(false);

const rootClasses = computed(() =>
  cx(
    'vf-table-of-contents',
    `vf-table-of-contents--${props.variant}`,
    isReady.value && 'vf-table-of-contents--ready',
    attrs.class as string | undefined,
  ),
);
const rootStyles = computed<StyleValue>(() => attrs.style as StyleValue);
const navAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'class' && key !== 'style')),
);

function normalizeLevel(level?: number) {
  if (!level || level < 1) {
    return 1;
  }

  return Math.min(level, 6);
}

function itemHref(item: VfTableOfContentsItem) {
  return item.href ?? `#${item.id}`;
}

function scrollToItem(
  item: VfTableOfContentsItem,
  options?: {
    updateHistory?: boolean;
  },
) {
  const href = itemHref(item);

  if (!href.startsWith('#')) {
    return;
  }

  const targetId = decodeURIComponent(href.slice(1));

  if (!targetId) {
    return;
  }

  const target = document.getElementById(targetId);

  if (!target) {
    return;
  }

  const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - props.scrollOffset);

  if (options?.updateHistory && window.location.hash !== href) {
    window.history.pushState(null, '', href);
  }

  window.scrollTo({
    top,
    behavior: props.smooth ? 'smooth' : 'auto',
  });
}

function handleLinkClick(event: MouseEvent, item: VfTableOfContentsItem) {
  const href = itemHref(item);

  if ((!props.smooth && props.scrollOffset <= 0) || !href.startsWith('#')) {
    return;
  }

  const targetId = decodeURIComponent(href.slice(1));

  if (!targetId) {
    return;
  }

  event.preventDefault();

  scrollToItem(item, {
    updateHistory: true,
  });
}

onMounted(async () => {
  requestAnimationFrame(() => {
    isReady.value = true;
  });

  if (typeof window === 'undefined' || !window.location.hash) {
    return;
  }

  const hash = decodeURIComponent(window.location.hash);
  const initialItem = props.items.find((item) => itemHref(item) === hash);

  if (!initialItem) {
    return;
  }

  await nextTick();
  requestAnimationFrame(() => {
    scrollToItem(initialItem);
  });
});
</script>

<template>
  <nav :class="rootClasses" :style="rootStyles" :aria-label="props.ariaLabel" v-bind="navAttrs">
    <ol class="vf-table-of-contents__list">
      <li
        v-for="item in props.items"
        :key="item.id"
        class="vf-table-of-contents__item"
        :style="{ '--vf-toc-level': String(normalizeLevel(item.level)) }"
      >
        <a
          :href="itemHref(item)"
          :class="['vf-table-of-contents__link', props.activeId === item.id && 'vf-table-of-contents__link--active']"
          :aria-current="props.activeId === item.id ? 'location' : undefined"
          @click="handleLinkClick($event, item)"
        >
          {{ item.label }}
        </a>
      </li>
    </ol>
  </nav>
</template>
