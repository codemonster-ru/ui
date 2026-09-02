<script setup lang="ts">
import { computed, useAttrs, useSlots, type PropType } from 'vue';
import { shellStickyOffsets } from '@codemonster-ru/ui-runtime/core';

import { cmDocumentLayoutVariants, type CmDocumentLayoutVariant } from './document-layout.types';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  layout: {
    type: String as PropType<CmDocumentLayoutVariant>,
    default: 'sidebar-content-aside',
    validator: (value: string) => ['content', 'sidebar-content', 'sidebar-content-aside'].includes(value),
  },
});
const attrs = useAttrs();
const slots = useSlots();

const layout = computed(() =>
  cmDocumentLayoutVariants.includes(props.layout) ? props.layout : 'sidebar-content-aside',
);
const hasHeader = computed(() => Boolean(slots.header));
const hasSubheader = computed(() => Boolean(slots.subheader));
const hasSidebar = computed(() => layout.value !== 'content' && Boolean(slots.sidebar));
const hasAside = computed(() => layout.value === 'sidebar-content-aside' && Boolean(slots.aside));

/**
 * The offsets are published without a measured height, so the server and the client render the same
 * thing. `CmShellMetricsController` narrows them to the observed height afterwards; until it does,
 * the declared `--cm-layout-*-height` is what the page sticks against.
 */
const stickyOffsets = computed(() =>
  shellStickyOffsets({ hasHeader: hasHeader.value, hasSubheader: hasSubheader.value }),
);
</script>

<template>
  <div
    v-bind="attrs"
    class="cm-document-layout"
    :class="`cm-document-layout--${layout}`"
    :style="stickyOffsets"
    data-cm-controller="shell-metrics"
  >
    <header v-if="hasHeader" class="cm-document-layout__header" data-cm-sticky-header>
      <slot name="header" />
    </header>
    <div v-if="hasSubheader" class="cm-document-layout__subheader" data-cm-sticky-subheader>
      <slot name="subheader" />
    </div>
    <main class="cm-document-layout__content">
      <aside v-if="hasSidebar" class="cm-document-layout__sidebar"><slot name="sidebar" /></aside>
      <section class="cm-document-layout__main"><slot /></section>
      <aside v-if="hasAside" class="cm-document-layout__aside"><slot name="aside" /></aside>
    </main>
    <footer v-if="slots.footer" class="cm-document-layout__footer"><slot name="footer" /></footer>
  </div>
</template>
