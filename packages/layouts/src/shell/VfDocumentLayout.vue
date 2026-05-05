<script setup lang="ts">
import { Comment, Fragment, Text, type VNode, computed, ref, type StyleValue, useAttrs, useSlots } from 'vue';
import { vfBreakpoints } from '@codemonster-ru/vueforge-core/foundation';
import { useCssVarBreakpointMatch } from '../composables/useCssVarBreakpointMatch';
import { useObservedElementHeight } from '../composables/useObservedElementHeight';
import { cx } from '../utils/classes';
import VfContainer from '../primitives/VfContainer.vue';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    as?: string;
    layout?: 'content' | 'sidebar-content' | 'sidebar-content-aside';
    fillViewport?: boolean;
    edgeNotches?: boolean;
    showSubheader?: boolean;
    showContentSubheader?: boolean;
    stickyHeader?: boolean;
    stickySidebar?: boolean;
    stickyAside?: boolean;
  }>(),
  {
    as: 'div',
    layout: 'content',
    fillViewport: false,
    edgeNotches: false,
    showSubheader: true,
    showContentSubheader: true,
    stickyHeader: undefined,
    stickySidebar: false,
    stickyAside: false,
  },
);

const attrs = useAttrs();
const slots = useSlots();
const headerRef = ref<HTMLElement | null>(null);
const subheaderRef = ref<HTMLElement | null>(null);
const mediaCompactAside = useCssVarBreakpointMatch('--vf-breakpoint-xl', vfBreakpoints.xl);
const mediaCompactSidebar = useCssVarBreakpointMatch('--vf-breakpoint-lg', vfBreakpoints.lg);
const mediaContainerInset = useCssVarBreakpointMatch('--vf-breakpoint-md', vfBreakpoints.md, 'min');
const isCompactAside = computed(() => props.layout === 'sidebar-content-aside' && mediaCompactAside.value);
const isCompactSidebar = computed(() => props.layout !== 'content' && mediaCompactSidebar.value);
const containerClasses = computed(() =>
  cx('vf-document-layout__container', mediaContainerInset.value && 'vf-document-layout__container--padded'),
);

const classes = computed(() =>
  cx(
    'vf-document-layout',
    `vf-document-layout--${props.layout}`,
    isCompactAside.value && 'vf-document-layout--compact-aside',
    isCompactSidebar.value && 'vf-document-layout--compact-sidebar',
    props.fillViewport && 'vf-document-layout--fill-viewport',
    props.edgeNotches && 'vf-document-layout--edge-notches',
    props.stickyHeader === true && 'vf-document-layout--header-sticky',
    props.stickyHeader === false && 'vf-document-layout--header-static',
    props.stickySidebar && 'vf-document-layout--sidebar-sticky',
    props.stickyAside && 'vf-document-layout--aside-sticky',
  ),
);
const hasHeader = computed(() => Boolean(slots.header));
const hasSubheader = computed(() => hasHeader.value && props.showSubheader && Boolean(slots.subheader));
const hasContentSubheader = computed(
  () => props.showContentSubheader && Boolean(slots['content-subheader']) && Boolean(slots.default),
);
const hasFooter = computed(() => Boolean(slots.footer));
function hasSlotContent(name: 'sidebar' | 'aside') {
  const slot = slots[name];

  if (!slot) return false;

  const nodes = slot();

  function hasMeaningfulNode(node: VNode): boolean {
    if (node.type === Comment) return false;
    if (node.type === Text) {
      return String(node.children ?? '').trim().length > 0;
    }
    if (node.type === Fragment) {
      const children = Array.isArray(node.children) ? node.children : [];
      return children.some((child) => hasMeaningfulNode(child as VNode));
    }

    return true;
  }

  return nodes.some((node) => hasMeaningfulNode(node));
}
const headerHeight = useObservedElementHeight(headerRef);
const subheaderHeight = useObservedElementHeight(subheaderRef);
const stickyOffsetsStyle = computed<StyleValue>(() => {
  const effectiveHeaderHeight = hasHeader.value ? headerHeight.value : 0;
  const effectiveSubheaderHeight = hasSubheader.value ? subheaderHeight.value : 0;

  return {
    '--vf-sticky-header-offset': `${effectiveHeaderHeight}px`,
    '--vf-sticky-subheader-offset': `${effectiveSubheaderHeight}px`,
    '--vf-sticky-top-offset': `${effectiveHeaderHeight + effectiveSubheaderHeight}px`,
  };
});
const contentClasses = computed(() =>
  cx('vf-document-layout__content-grid', `vf-document-layout__content-grid--${props.layout}`),
);
</script>

<template>
  <VfContainer size="2xl" :class="containerClasses">
    <component :is="props.as" :class="classes" :style="stickyOffsetsStyle" v-bind="attrs">
      <header v-if="hasHeader" ref="headerRef" class="vf-document-layout__header">
        <slot name="header" />
      </header>

      <div v-if="hasSubheader" ref="subheaderRef" class="vf-document-layout__subheader">
        <slot name="subheader" />
      </div>

      <main class="vf-document-layout__content">
        <div :class="contentClasses">
          <aside v-if="props.layout !== 'content' && hasSlotContent('sidebar')" class="vf-document-layout__sidebar">
            <div class="vf-document-layout__sidebar-inner">
              <slot name="sidebar" />
            </div>
          </aside>

          <section class="vf-document-layout__main">
            <div v-if="hasContentSubheader" class="vf-document-layout__content-subheader">
              <slot name="content-subheader" />
            </div>
            <div class="vf-document-layout__main-body">
              <slot />
            </div>
          </section>

          <aside
            v-if="props.layout === 'sidebar-content-aside' && hasSlotContent('aside')"
            class="vf-document-layout__aside"
          >
            <div class="vf-document-layout__aside-inner">
              <slot name="aside" />
            </div>
          </aside>
        </div>
      </main>

      <footer v-if="hasFooter" class="vf-document-layout__footer">
        <slot name="footer" />
      </footer>
    </component>
  </VfContainer>
</template>
