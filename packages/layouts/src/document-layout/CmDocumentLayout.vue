<script setup lang="ts">
import { computed, useAttrs, useSlots, useTemplateRef } from 'vue';

import { cmDocumentLayoutVariants, type CmDocumentLayoutProps } from './document-layout.types';
import { useShellStickyOffsets } from '../use-shell-sticky-offsets';
import { useLayoutOwnership } from '../use-layout-ownership';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<CmDocumentLayoutProps>(), {
  as: 'div',
  layout: 'content',
  showSubheader: true,
  showContentSubheader: true,
});
const attrs = useAttrs();
const slots = useSlots();

const layout = computed(() => (cmDocumentLayoutVariants.includes(props.layout) ? props.layout : 'content'));
const hasHeader = computed(() => Boolean(slots.header));
const hasSubheader = computed(() => props.showSubheader && hasHeader.value && Boolean(slots.subheader));
const hasSidebar = computed(() => layout.value !== 'content' && Boolean(slots.sidebar));
const hasAside = computed(() => layout.value === 'sidebar-content-aside' && Boolean(slots.aside));

const header = useTemplateRef<HTMLElement>('header');
useLayoutOwnership(useTemplateRef<HTMLElement>('root'));
const subheader = useTemplateRef<HTMLElement>('subheader');
const stickyOffsets = useShellStickyOffsets(
  header,
  subheader,
  hasHeader,
  hasSubheader,
  computed(() => props.stickyHeader === true),
);
</script>

<template>
  <component
    :is="props.as"
    ref="root"
    v-bind="attrs"
    class="cm-document-layout"
    :class="[
      `cm-document-layout--${layout}`,
      !fillViewport && 'cm-document-layout--fit-content',
      edgeNotches && 'cm-document-layout--edge-notches',
      !stickyHeader && 'cm-document-layout--header-static',
      !stickySidebar && 'cm-document-layout--sidebar-static',
      !stickyAside && 'cm-document-layout--aside-static',
    ]"
    :style="stickyOffsets"
    data-cm-controller="shell-metrics"
  >
    <header v-if="hasHeader" ref="header" class="cm-document-layout__header" data-cm-sticky-header>
      <slot name="header" />
    </header>
    <div v-if="hasSubheader" ref="subheader" class="cm-document-layout__subheader" data-cm-sticky-subheader>
      <slot name="subheader" />
    </div>
    <main class="cm-document-layout__content">
      <aside v-if="hasSidebar" class="cm-document-layout__sidebar"><slot name="sidebar" /></aside>
      <section class="cm-document-layout__main">
        <div
          v-if="showContentSubheader && slots['content-subheader'] && slots.default"
          class="cm-document-layout__content-subheader"
        >
          <slot name="content-subheader" />
        </div>
        <slot />
      </section>
      <aside v-if="hasAside" class="cm-document-layout__aside"><slot name="aside" /></aside>
    </main>
    <footer v-if="slots.footer" class="cm-document-layout__footer"><slot name="footer" /></footer>
  </component>
</template>
