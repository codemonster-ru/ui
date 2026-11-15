<script setup lang="ts">
import { computed, nextTick, ref, useAttrs, useId, useTemplateRef, watch } from 'vue';

import {
  resolveMobileToggleLabel,
  shellEscapeState,
  toggleShellMobileSidebar,
  toggleShellSidebar,
  type CmShellState,
} from '@codemonster-ru/ui-runtime/core';
import type {
  CmAdminLayoutExposed,
  CmAdminLayoutMobileSidebarScope,
  CmAdminLayoutProps,
  CmAdminLayoutScope,
} from './admin-layout.types';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<CmAdminLayoutProps>(), {
  as: 'div',
  fillViewport: true,
  sidebarCollapsed: undefined,
  defaultSidebarCollapsed: false,
  mobileSidebarOpen: undefined,
  defaultMobileSidebarOpen: false,
  mobileSidebarOpenLabel: 'Open navigation',
  mobileSidebarCloseLabel: 'Close navigation',
});
const emit = defineEmits<{
  sidebarCollapsedChange: [collapsed: boolean];
  mobileSidebarOpenChange: [open: boolean];
  'update:sidebarCollapsed': [collapsed: boolean];
  'update:mobileSidebarOpen': [open: boolean];
}>();
const attrs = useAttrs();
const slots = defineSlots<{
  brand?: (scope: CmAdminLayoutScope) => unknown;
  aside?: (scope: CmAdminLayoutScope) => unknown;
  'mobile-toggle'?: (scope: CmAdminLayoutMobileSidebarScope) => unknown;
  mobileToggle?: (scope: CmAdminLayoutMobileSidebarScope) => unknown;
  'mobile-brand'?: () => unknown;
  mobileBrand?: () => unknown;
  header?: (scope: CmAdminLayoutScope) => unknown;
  default?: (scope: CmAdminLayoutScope) => unknown;
  footer?: () => unknown;
}>();
const generatedId = `cm-admin-layout-sidebar-${useId()}`;
const sidebarId = computed(() => props.id ?? generatedId);
const sidebar = useTemplateRef<HTMLElement>('sidebar');
const mobileToggle = useTemplateRef<HTMLElement>('mobileToggle');

const localCollapsed = ref(props.sidebarCollapsed ?? props.defaultSidebarCollapsed);
const localMobileOpen = ref(props.mobileSidebarOpen ?? props.defaultMobileSidebarOpen);
const state = computed<CmShellState>(() => ({
  sidebarCollapsed: props.sidebarCollapsed ?? localCollapsed.value,
  mobileSidebarOpen: props.mobileSidebarOpen ?? localMobileOpen.value,
}));
watch(
  () => props.sidebarCollapsed,
  (value) => {
    if (value !== undefined) localCollapsed.value = value;
  },
);
watch(
  () => props.mobileSidebarOpen,
  (value, previous) => {
    if (value !== undefined) localMobileOpen.value = value;
    if (previous && !value) restoreToggleFocus();
  },
);

const hasAside = computed(() => Boolean(slots.brand || slots.aside));
const hasMobileBrand = computed(() => Boolean(slots['mobile-brand'] || slots.mobileBrand));
const hasHeader = computed(() => Boolean(slots.header || hasMobileBrand.value || hasAside.value));
const hovered = ref(false);
const hasFocusedChild = ref(false);
const toggleLabel = computed(() =>
  resolveMobileToggleLabel(state.value.mobileSidebarOpen, {
    close: props.mobileSidebarCloseLabel,
    open: props.mobileSidebarOpenLabel,
  }),
);

function restoreToggleFocus(): void {
  const active = sidebar.value?.ownerDocument.activeElement;
  if (!active || !sidebar.value?.contains(active)) return;
  void nextTick(() => {
    if (state.value.mobileSidebarOpen || sidebar.value?.ownerDocument.activeElement !== active) return;
    mobileToggle.value?.querySelector<HTMLElement>('button:not(:disabled), [tabindex="0"]')?.focus();
  });
}

function commit(next: CmShellState): void {
  const previous = state.value;

  if (next.sidebarCollapsed !== previous.sidebarCollapsed) {
    if (props.sidebarCollapsed === undefined) localCollapsed.value = next.sidebarCollapsed;
    emit('update:sidebarCollapsed', next.sidebarCollapsed);
    emit('sidebarCollapsedChange', next.sidebarCollapsed);
  }
  if (next.mobileSidebarOpen !== previous.mobileSidebarOpen) {
    if (props.mobileSidebarOpen === undefined) {
      localMobileOpen.value = next.mobileSidebarOpen;
      if (!next.mobileSidebarOpen) restoreToggleFocus();
    }
    emit('update:mobileSidebarOpen', next.mobileSidebarOpen);
    emit('mobileSidebarOpenChange', next.mobileSidebarOpen);
  }
}

const collapseSidebar = () => commit({ ...state.value, sidebarCollapsed: true });
const expandSidebar = () => commit({ ...state.value, sidebarCollapsed: false });
const toggleSidebarCollapsed = () => commit(toggleShellSidebar(state.value));
const closeMobileSidebar = () => commit({ ...state.value, mobileSidebarOpen: false });
const openMobileSidebar = () => commit({ ...state.value, mobileSidebarOpen: true });
const toggleMobileSidebar = () => commit(toggleShellMobileSidebar(state.value));
const mobileControls = { closeMobileSidebar, openMobileSidebar, toggleMobileSidebar };
const controls = {
  ...mobileControls,
  collapseSidebar,
  expandSidebar,
  toggleSidebarCollapsed,
} satisfies CmAdminLayoutExposed;
const scope = computed<CmAdminLayoutScope>(() => ({
  ...controls,
  isSidebarCollapsed: state.value.sidebarCollapsed,
  isSidebarCompact: state.value.sidebarCollapsed && !hovered.value && !hasFocusedChild.value,
  isMobileSidebarOpen: state.value.mobileSidebarOpen,
}));
const mobileScope = computed<CmAdminLayoutMobileSidebarScope>(() => ({
  ...mobileControls,
  isMobileSidebarOpen: state.value.mobileSidebarOpen,
  mobileToggleAttrs: {
    'aria-label': toggleLabel.value,
    'aria-controls': sidebarId.value,
    'aria-expanded': state.value.mobileSidebarOpen,
  },
}));
defineExpose(controls);

function onAsideFocusOut(event: FocusEvent): void {
  hasFocusedChild.value = event.relatedTarget instanceof Node && sidebar.value?.contains(event.relatedTarget) === true;
}

function onClick(event: MouseEvent): void {
  const target = event.target;
  if (
    event.defaultPrevented ||
    !(target instanceof Element) ||
    target.closest('.cm-admin-layout') !== event.currentTarget
  )
    return;

  if (target.closest('[data-cm-sidebar-toggle]')) {
    toggleSidebarCollapsed();
    return;
  }

  if (target.closest('[data-cm-mobile-sidebar-close]')) closeMobileSidebar();
  else if (target.closest('[data-cm-mobile-sidebar-toggle]')) toggleMobileSidebar();
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || event.defaultPrevented) return;

  const next = shellEscapeState(state.value);
  if (next === null) return;

  event.preventDefault();
  commit(next);
}
</script>

<template>
  <component
    :is="props.as"
    v-bind="attrs"
    class="cm-admin-layout"
    :class="{ 'cm-admin-layout--fit-content': !fillViewport }"
    data-cm-controller="admin-layout"
    :data-cm-sidebar-collapsed="String(state.sidebarCollapsed)"
    :data-cm-mobile-sidebar-open="String(state.mobileSidebarOpen)"
    @click="onClick"
    @keydown="onKeydown"
  >
    <aside
      v-if="hasAside"
      :id="sidebarId"
      ref="sidebar"
      class="cm-admin-layout__aside"
      @mouseenter="hovered = true"
      @mouseleave="hovered = false"
      @focusin="hasFocusedChild = true"
      @focusout="onAsideFocusOut"
    >
      <div v-if="$slots.brand" class="cm-admin-layout__brand"><slot name="brand" v-bind="scope" /></div>
      <div v-if="$slots.aside" class="cm-admin-layout__aside-content"><slot name="aside" v-bind="scope" /></div>
    </aside>
    <div v-if="hasAside" class="cm-admin-layout__mobile-backdrop" aria-hidden="true" data-cm-mobile-sidebar-close></div>
    <div class="cm-admin-layout__main">
      <header v-if="hasHeader" class="cm-admin-layout__header">
        <div v-if="hasAside" ref="mobileToggle" class="cm-admin-layout__mobile-toggle">
          <slot name="mobile-toggle" v-bind="mobileScope">
            <slot name="mobileToggle" v-bind="mobileScope">
              <button
                class="cm-admin-layout__mobile-toggle-button"
                type="button"
                data-cm-mobile-sidebar-toggle
                v-bind="mobileScope.mobileToggleAttrs"
              >
                <span class="cm-admin-layout__mobile-toggle-icon" aria-hidden="true"></span>
              </button>
            </slot>
          </slot>
        </div>
        <div v-if="hasMobileBrand" class="cm-admin-layout__mobile-brand">
          <slot name="mobile-brand"><slot name="mobileBrand" /></slot>
        </div>
        <div v-if="$slots.header" class="cm-admin-layout__header-content"><slot name="header" v-bind="scope" /></div>
      </header>
      <main class="cm-admin-layout__content"><slot v-bind="scope" /></main>
      <footer v-if="$slots.footer" class="cm-admin-layout__footer"><slot name="footer" /></footer>
    </div>
  </component>
</template>
