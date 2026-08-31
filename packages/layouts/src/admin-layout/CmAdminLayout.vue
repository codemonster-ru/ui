<script setup lang="ts">
import { computed, ref, useAttrs, useSlots, watch } from 'vue';

import {
  resolveMobileToggleLabel,
  shellEscapeState,
  toggleShellMobileSidebar,
  toggleShellSidebar,
} from '@codemonster-ru/ui-runtime/core';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  id: { type: String, required: true },
  sidebarCollapsed: { type: Boolean, default: false },
  mobileSidebarOpen: { type: Boolean, default: false },
  mobileSidebarOpenLabel: { type: String, default: 'Open navigation' },
  mobileSidebarCloseLabel: { type: String, default: 'Close navigation' },
});
const emit = defineEmits<{
  sidebarCollapsedChange: [collapsed: boolean];
  mobileSidebarOpenChange: [open: boolean];
  'update:sidebarCollapsed': [collapsed: boolean];
  'update:mobileSidebarOpen': [open: boolean];
}>();
const attrs = useAttrs();
const slots = useSlots();

// The layout keeps its own copy so it works uncontrolled; a parent that binds the props stays in
// charge because the watchers below follow them.
const state = ref({ mobileSidebarOpen: props.mobileSidebarOpen, sidebarCollapsed: props.sidebarCollapsed });
watch(
  () => [props.sidebarCollapsed, props.mobileSidebarOpen] as const,
  ([collapsed, open]) => (state.value = { mobileSidebarOpen: open, sidebarCollapsed: collapsed }),
);

const hasAside = computed(() => Boolean(slots.brand || slots.aside));
const hasHeader = computed(() => Boolean(slots.header || slots.mobileBrand || hasAside.value));
const toggleLabel = computed(() =>
  resolveMobileToggleLabel(state.value.mobileSidebarOpen, {
    close: props.mobileSidebarCloseLabel,
    open: props.mobileSidebarOpenLabel,
  }),
);

function commit(next: { mobileSidebarOpen: boolean; sidebarCollapsed: boolean }): void {
  const previous = state.value;
  state.value = next;

  if (next.sidebarCollapsed !== previous.sidebarCollapsed) {
    emit('update:sidebarCollapsed', next.sidebarCollapsed);
    emit('sidebarCollapsedChange', next.sidebarCollapsed);
  }
  if (next.mobileSidebarOpen !== previous.mobileSidebarOpen) {
    emit('update:mobileSidebarOpen', next.mobileSidebarOpen);
    emit('mobileSidebarOpenChange', next.mobileSidebarOpen);
  }
}

// Controls are marked rather than wired: an application puts its own collapse button anywhere in
// the layout and tags it, which is what replaces handing every slot a set of control functions.
function onClick(event: MouseEvent): void {
  const target = event.target;
  if (!(target instanceof Element)) return;

  if (target.closest('[data-cm-sidebar-toggle]')) {
    commit(toggleShellSidebar(state.value));
    return;
  }

  if (target.closest('[data-cm-mobile-sidebar-toggle]') || target.closest('[data-cm-mobile-sidebar-close]')) {
    commit(toggleShellMobileSidebar(state.value));
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return;

  const next = shellEscapeState(state.value);
  if (next === null) return;

  event.preventDefault();
  commit(next);
}
</script>

<template>
  <div
    v-bind="attrs"
    class="cm-admin-layout"
    data-cm-controller="admin-layout"
    :data-cm-sidebar-collapsed="String(state.sidebarCollapsed)"
    :data-cm-mobile-sidebar-open="String(state.mobileSidebarOpen)"
    @click="onClick"
    @keydown="onKeydown"
  >
    <aside v-if="hasAside" :id="props.id" class="cm-admin-layout__aside">
      <div v-if="$slots.brand" class="cm-admin-layout__brand"><slot name="brand" /></div>
      <div v-if="$slots.aside" class="cm-admin-layout__aside-content"><slot name="aside" /></div>
    </aside>
    <div v-if="hasAside" class="cm-admin-layout__mobile-backdrop" aria-hidden="true" data-cm-mobile-sidebar-close></div>
    <div class="cm-admin-layout__main">
      <header v-if="hasHeader" class="cm-admin-layout__header">
        <div v-if="hasAside" class="cm-admin-layout__mobile-toggle">
          <slot name="mobileToggle">
            <button
              class="cm-admin-layout__mobile-toggle-button"
              type="button"
              data-cm-mobile-sidebar-toggle
              :aria-label="toggleLabel"
              :aria-expanded="state.mobileSidebarOpen"
              :aria-controls="props.id"
            >
              <span class="cm-admin-layout__mobile-toggle-icon" aria-hidden="true"></span>
            </button>
          </slot>
        </div>
        <div v-if="$slots.mobileBrand" class="cm-admin-layout__mobile-brand"><slot name="mobileBrand" /></div>
        <div v-if="$slots.header" class="cm-admin-layout__header-content"><slot name="header" /></div>
      </header>
      <main class="cm-admin-layout__content"><slot /></main>
      <footer v-if="$slots.footer" class="cm-admin-layout__footer"><slot name="footer" /></footer>
    </div>
  </div>
</template>
