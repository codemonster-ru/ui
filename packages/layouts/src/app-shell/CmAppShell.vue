<script setup lang="ts">
import { computed, ref, useAttrs, useSlots, watch, type PropType } from 'vue';
import { cmShellAttributes, shellStickyOffsets, toggleShellSidebar } from '@codemonster-ru/ui-runtime/core';

import { cmAppShellVariants, type CmAppShellVariant } from './app-shell.types';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  layout: {
    type: String as PropType<CmAppShellVariant>,
    default: 'sidebar-content-aside',
    validator: (value: string) => ['content', 'sidebar-content', 'sidebar-content-aside'].includes(value),
  },
  sidebarCollapsed: { type: Boolean, default: false },
  stickyHeader: { type: Boolean, default: false },
});
const emit = defineEmits<{
  sidebarCollapsedChange: [collapsed: boolean];
  'update:sidebarCollapsed': [collapsed: boolean];
}>();
const attrs = useAttrs();
const slots = useSlots();

// The shell keeps its own copy so it works uncontrolled; a parent that binds the prop stays in
// charge because the watcher follows it.
const collapsed = ref(props.sidebarCollapsed);
watch(
  () => props.sidebarCollapsed,
  (value) => (collapsed.value = value),
);

const layout = computed(() => (cmAppShellVariants.includes(props.layout) ? props.layout : 'sidebar-content-aside'));
const hasHeader = computed(() => Boolean(slots.header));
const hasSubheader = computed(() => Boolean(slots.subheader));
const hasSidebar = computed(() => layout.value !== 'content' && Boolean(slots.sidebar));
const hasAside = computed(() => layout.value === 'sidebar-content-aside' && Boolean(slots.aside));
const stickyOffsets = computed(() =>
  shellStickyOffsets({ hasHeader: hasHeader.value, hasSubheader: hasSubheader.value }),
);

/**
 * The sidebar state is an attribute rather than a scoped slot, because PHP has no scoped slots. The
 * toggle is marked rather than wired: an application tags its own control with
 * `data-cm-sidebar-toggle` and the controller listens for it.
 */
function onClick(event: MouseEvent): void {
  const origin = event.target instanceof Element ? event.target : null;
  const target = origin?.closest('[data-cm-sidebar-toggle]') ?? null;
  if (!target) return;

  const next = toggleShellSidebar({ mobileSidebarOpen: false, sidebarCollapsed: collapsed.value });
  collapsed.value = next.sidebarCollapsed;

  // The control belongs to the application, so it is reached rather than rendered. The runtime
  // controller writes the same attribute, and the two adapters have to leave the page in the same
  // state or the marked-control pattern means different things on each.
  target.setAttribute('aria-expanded', String(!next.sidebarCollapsed));

  emit('update:sidebarCollapsed', next.sidebarCollapsed);
  emit('sidebarCollapsedChange', next.sidebarCollapsed);
}
</script>

<template>
  <div
    v-bind="attrs"
    class="cm-app-shell"
    :class="[`cm-app-shell--${layout}`, stickyHeader && 'cm-app-shell--header-sticky']"
    :style="stickyOffsets"
    :[cmShellAttributes.sidebarCollapsed]="String(collapsed)"
    data-cm-controller="app-shell shell-metrics"
    @click="onClick"
  >
    <header v-if="hasHeader" class="cm-app-shell__header" data-cm-sticky-header>
      <slot name="header" />
    </header>
    <div v-if="hasSubheader" class="cm-app-shell__subheader" data-cm-sticky-subheader>
      <slot name="subheader" />
    </div>
    <div class="cm-app-shell__body">
      <aside v-if="hasSidebar" class="cm-app-shell__sidebar"><slot name="sidebar" /></aside>
      <main class="cm-app-shell__content"><slot /></main>
      <aside v-if="hasAside" class="cm-app-shell__aside"><slot name="aside" /></aside>
    </div>
    <footer v-if="slots.footer" class="cm-app-shell__footer"><slot name="footer" /></footer>
  </div>
</template>
