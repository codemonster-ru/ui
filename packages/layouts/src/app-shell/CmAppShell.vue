<script setup lang="ts">
import { computed, ref, useAttrs, useTemplateRef, watch, watchPostEffect } from 'vue';
import { cmShellAttributes, toggleShellSidebar } from '@codemonster-ru/ui-runtime/core';

import {
  cmAppShellVariants,
  type CmAppShellExposed,
  type CmAppShellProps,
  type CmAppShellScope,
} from './app-shell.types';
import { useShellStickyOffsets } from '../use-shell-sticky-offsets';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<CmAppShellProps>(), {
  as: 'div',
  layout: 'sidebar-content-aside',
  showSubheader: true,
  showContentSubheader: true,
  sidebarCollapsed: undefined,
  defaultSidebarCollapsed: false,
  stickyHeader: undefined,
  contentPadded: true,
});
const emit = defineEmits<{
  sidebarCollapsedChange: [collapsed: boolean];
  'update:sidebarCollapsed': [collapsed: boolean];
}>();
const attrs = useAttrs();
const slots = defineSlots<{
  header?: () => unknown;
  subheader?: () => unknown;
  sidebar?: (scope: CmAppShellScope) => unknown;
  'content-subheader'?: () => unknown;
  default?: (scope: CmAppShellScope) => unknown;
  aside?: () => unknown;
  footer?: () => unknown;
}>();

const localCollapsed = ref(props.sidebarCollapsed ?? props.defaultSidebarCollapsed);
const collapsed = computed(() => props.sidebarCollapsed ?? localCollapsed.value);
watch(
  () => props.sidebarCollapsed,
  (value) => {
    if (value !== undefined) localCollapsed.value = value;
  },
);

const layout = computed(() => (cmAppShellVariants.includes(props.layout) ? props.layout : 'sidebar-content-aside'));
const hasHeader = computed(() => Boolean(slots.header));
const hasSubheader = computed(() => props.showSubheader && hasHeader.value && Boolean(slots.subheader));
const hasSidebar = computed(() => layout.value !== 'content' && Boolean(slots.sidebar));
const hasAside = computed(() => layout.value === 'sidebar-content-aside' && Boolean(slots.aside));
const header = useTemplateRef<HTMLElement>('header');
const subheader = useTemplateRef<HTMLElement>('subheader');
const shell = useTemplateRef<HTMLElement>('shell');
const stickyOffsets = useShellStickyOffsets(
  header,
  subheader,
  hasHeader,
  hasSubheader,
  computed(() => props.stickyHeader === true),
);

function setSidebarCollapsed(value: boolean): void {
  if (value === collapsed.value) return;
  if (props.sidebarCollapsed === undefined) localCollapsed.value = value;
  emit('update:sidebarCollapsed', value);
  emit('sidebarCollapsedChange', value);
}

function collapseSidebar(): void {
  setSidebarCollapsed(true);
}

function expandSidebar(): void {
  setSidebarCollapsed(false);
}

function toggleSidebarCollapsed(): void {
  const next = toggleShellSidebar({ mobileSidebarOpen: false, sidebarCollapsed: collapsed.value });
  setSidebarCollapsed(next.sidebarCollapsed);
}

const controls = { collapseSidebar, expandSidebar, toggleSidebarCollapsed } satisfies CmAppShellExposed;
const scope = computed<CmAppShellScope>(() => ({ ...controls, isSidebarCollapsed: collapsed.value }));
defineExpose(controls);

watchPostEffect(() => {
  const expanded = String(!collapsed.value);
  const root = shell.value;
  for (const toggle of root?.querySelectorAll('[data-cm-sidebar-toggle]') ?? []) {
    if (toggle.closest('.cm-app-shell') === root) toggle.setAttribute('aria-expanded', expanded);
  }
});

function onClick(event: MouseEvent): void {
  if (event.defaultPrevented) return;
  const origin = event.target instanceof Element ? event.target : null;
  const target = origin?.closest('[data-cm-sidebar-toggle]') ?? null;
  if (!target || origin?.closest('.cm-app-shell') !== event.currentTarget) return;
  toggleSidebarCollapsed();
}
</script>

<template>
  <component
    :is="props.as"
    ref="shell"
    v-bind="attrs"
    class="cm-app-shell"
    :class="[
      `cm-app-shell--${layout}`,
      !props.fillViewport && 'cm-app-shell--fit-content',
      props.stickyHeader === true ? 'cm-app-shell--header-sticky' : 'cm-app-shell--header-static',
      !props.stickySidebar && 'cm-app-shell--sidebar-static',
      !props.stickyAside && 'cm-app-shell--aside-static',
    ]"
    :style="stickyOffsets"
    :[cmShellAttributes.sidebarCollapsed]="String(collapsed)"
    data-cm-controller="app-shell shell-metrics"
    @click="onClick"
  >
    <header v-if="hasHeader" ref="header" class="cm-app-shell__header" data-cm-sticky-header>
      <slot name="header" />
    </header>
    <div v-if="hasSubheader" ref="subheader" class="cm-app-shell__subheader" data-cm-sticky-subheader>
      <slot name="subheader" />
    </div>
    <div class="cm-app-shell__body">
      <aside
        v-if="hasSidebar"
        class="cm-app-shell__sidebar"
        :class="sidebarAppearance === 'plain' && 'cm-app-shell__region--plain'"
      >
        <slot name="sidebar" v-bind="scope" />
      </aside>
      <main
        class="cm-app-shell__content"
        :class="[
          contentAppearance === 'plain' && 'cm-app-shell__region--plain',
          !contentPadded && 'cm-app-shell__content--unpadded',
        ]"
      >
        <div
          v-if="showContentSubheader && slots['content-subheader'] && slots.default"
          class="cm-app-shell__content-subheader"
        >
          <slot name="content-subheader" />
        </div>
        <slot v-bind="scope" />
      </main>
      <aside
        v-if="hasAside"
        class="cm-app-shell__aside"
        :class="asideAppearance === 'plain' && 'cm-app-shell__region--plain'"
      >
        <slot name="aside" />
      </aside>
    </div>
    <footer v-if="slots.footer" class="cm-app-shell__footer"><slot name="footer" /></footer>
  </component>
</template>
