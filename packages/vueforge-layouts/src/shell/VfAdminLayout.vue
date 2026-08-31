<script setup lang="ts">
import { computed, ref, useAttrs, useId, watchEffect } from 'vue';
import { cx } from '../utils/classes';
import type {
  VfAdminLayoutExposed,
  VfAdminLayoutMobileSidebarScope,
  VfAdminLayoutProps,
  VfAdminLayoutScope,
} from './admin-layout.types';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<VfAdminLayoutProps>(), {
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
  'update:sidebarCollapsed': [value: boolean];
  'update:mobileSidebarOpen': [value: boolean];
}>();

const attrs = useAttrs();
const slots = defineSlots<{
  brand?: (scope: VfAdminLayoutScope) => unknown;
  aside?: (scope: VfAdminLayoutScope) => unknown;
  'mobile-toggle'?: (scope: VfAdminLayoutMobileSidebarScope) => unknown;
  'mobile-brand'?: () => unknown;
  header?: (scope: VfAdminLayoutScope) => unknown;
  default?: (scope: VfAdminLayoutScope) => unknown;
  footer?: () => unknown;
}>();
const uncontrolledSidebarCollapsed = ref(props.defaultSidebarCollapsed);
const uncontrolledMobileSidebarOpen = ref(props.defaultMobileSidebarOpen);
const isSidebarPreviewExpanded = ref(false);
const sidebarId = `vf-admin-layout-sidebar-${useId()}`;

watchEffect(() => {
  if (props.sidebarCollapsed !== undefined) {
    uncontrolledSidebarCollapsed.value = props.sidebarCollapsed;
  }
});

const isSidebarCollapsed = computed(() =>
  props.sidebarCollapsed === undefined ? uncontrolledSidebarCollapsed.value : props.sidebarCollapsed,
);
const isSidebarCompact = computed(() => isSidebarCollapsed.value && !isSidebarPreviewExpanded.value);

watchEffect(() => {
  if (props.mobileSidebarOpen !== undefined) {
    uncontrolledMobileSidebarOpen.value = props.mobileSidebarOpen;
  }
});

const isMobileSidebarOpen = computed(() =>
  props.mobileSidebarOpen === undefined ? uncontrolledMobileSidebarOpen.value : props.mobileSidebarOpen,
);
const mobileToggleAttrs = computed(() => ({
  'aria-label': isMobileSidebarOpen.value ? props.mobileSidebarCloseLabel : props.mobileSidebarOpenLabel,
  'aria-controls': sidebarId,
  'aria-expanded': isMobileSidebarOpen.value,
}));

function setSidebarCollapsed(value: boolean) {
  if (value === isSidebarCollapsed.value) return;

  if (props.sidebarCollapsed === undefined) {
    uncontrolledSidebarCollapsed.value = value;
  }

  emit('update:sidebarCollapsed', value);
}

function collapseSidebar() {
  setSidebarCollapsed(true);
}

function expandSidebar() {
  setSidebarCollapsed(false);
}

function toggleSidebarCollapsed() {
  setSidebarCollapsed(!isSidebarCollapsed.value);
}

function expandSidebarPreview() {
  isSidebarPreviewExpanded.value = true;
}

function collapseSidebarPreview() {
  isSidebarPreviewExpanded.value = false;
}

function handleAsideFocusOut(event: FocusEvent) {
  const aside = event.currentTarget as HTMLElement;

  if (event.relatedTarget instanceof Node && aside.contains(event.relatedTarget)) return;

  collapseSidebarPreview();
}

function setMobileSidebarOpen(value: boolean) {
  if (value === isMobileSidebarOpen.value) return;

  if (props.mobileSidebarOpen === undefined) {
    uncontrolledMobileSidebarOpen.value = value;
  }

  emit('update:mobileSidebarOpen', value);
}

function closeMobileSidebar() {
  setMobileSidebarOpen(false);
}

function openMobileSidebar() {
  setMobileSidebarOpen(true);
}

function toggleMobileSidebar() {
  setMobileSidebarOpen(!isMobileSidebarOpen.value);
}

function handleEscape(event: KeyboardEvent) {
  if (event.key !== 'Escape' || event.defaultPrevented || !isMobileSidebarOpen.value) return;

  event.preventDefault();
  closeMobileSidebar();
}

const hasAside = computed(() => Boolean(slots.brand) || Boolean(slots.aside));
const hasBrand = computed(() => Boolean(slots.brand));
const hasDesktopHeader = computed(() => Boolean(slots.header));
const hasHeader = computed(() => hasDesktopHeader.value || hasAside.value || Boolean(slots['mobile-brand']));
const hasFooter = computed(() => Boolean(slots.footer));
const classes = computed(() =>
  cx(
    'vf-admin-layout',
    props.fillViewport && 'vf-admin-layout--fill-viewport',
    hasAside.value && 'vf-admin-layout--with-aside',
    hasBrand.value && 'vf-admin-layout--with-brand',
    hasBrand.value && Boolean(slots.aside) && 'vf-admin-layout--with-brand-divider',
    hasDesktopHeader.value && 'vf-admin-layout--with-header',
    hasAside.value && isSidebarCollapsed.value && 'vf-admin-layout--sidebar-collapsed',
    hasAside.value && isSidebarCompact.value && 'vf-admin-layout--sidebar-compact',
    hasAside.value && isMobileSidebarOpen.value && 'vf-admin-layout--mobile-sidebar-open',
  ),
);

defineExpose<VfAdminLayoutExposed>({
  collapseSidebar,
  expandSidebar,
  toggleSidebarCollapsed,
  closeMobileSidebar,
  openMobileSidebar,
  toggleMobileSidebar,
});
</script>

<template>
  <component :is="props.as" :class="classes" v-bind="attrs" @keydown="handleEscape">
    <aside
      v-if="hasAside"
      :id="sidebarId"
      class="vf-admin-layout__aside"
      @mouseenter="expandSidebarPreview"
      @mouseleave="collapseSidebarPreview"
      @focusin="expandSidebarPreview"
      @focusout="handleAsideFocusOut"
    >
      <div v-if="hasBrand" class="vf-admin-layout__brand">
        <slot
          name="brand"
          :is-sidebar-collapsed="isSidebarCollapsed"
          :is-sidebar-compact="isSidebarCompact"
          :is-mobile-sidebar-open="isMobileSidebarOpen"
          :collapse-sidebar="collapseSidebar"
          :expand-sidebar="expandSidebar"
          :toggle-sidebar-collapsed="toggleSidebarCollapsed"
          :close-mobile-sidebar="closeMobileSidebar"
          :open-mobile-sidebar="openMobileSidebar"
          :toggle-mobile-sidebar="toggleMobileSidebar"
        />
      </div>
      <div v-if="$slots.aside" class="vf-admin-layout__aside-content">
        <slot
          name="aside"
          :is-sidebar-collapsed="isSidebarCollapsed"
          :is-sidebar-compact="isSidebarCompact"
          :is-mobile-sidebar-open="isMobileSidebarOpen"
          :collapse-sidebar="collapseSidebar"
          :expand-sidebar="expandSidebar"
          :toggle-sidebar-collapsed="toggleSidebarCollapsed"
          :close-mobile-sidebar="closeMobileSidebar"
          :open-mobile-sidebar="openMobileSidebar"
          :toggle-mobile-sidebar="toggleMobileSidebar"
        />
      </div>
    </aside>

    <div v-if="hasAside" class="vf-admin-layout__mobile-backdrop" aria-hidden="true" @click="closeMobileSidebar" />

    <div class="vf-admin-layout__main">
      <header
        v-if="hasHeader"
        class="vf-admin-layout__header"
        :class="{ 'vf-admin-layout__header--mobile-only': !hasDesktopHeader }"
      >
        <div v-if="hasAside" class="vf-admin-layout__mobile-toggle">
          <slot
            name="mobile-toggle"
            :is-mobile-sidebar-open="isMobileSidebarOpen"
            :mobile-toggle-attrs="mobileToggleAttrs"
            :close-mobile-sidebar="closeMobileSidebar"
            :open-mobile-sidebar="openMobileSidebar"
            :toggle-mobile-sidebar="toggleMobileSidebar"
          >
            <button
              class="vf-admin-layout__mobile-toggle-button"
              type="button"
              v-bind="mobileToggleAttrs"
              @click="toggleMobileSidebar"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </slot>
        </div>

        <div v-if="$slots['mobile-brand']" class="vf-admin-layout__mobile-brand">
          <slot name="mobile-brand" />
        </div>

        <div v-if="$slots.header" class="vf-admin-layout__header-content">
          <slot
            name="header"
            :is-sidebar-collapsed="isSidebarCollapsed"
            :is-sidebar-compact="isSidebarCompact"
            :is-mobile-sidebar-open="isMobileSidebarOpen"
            :collapse-sidebar="collapseSidebar"
            :expand-sidebar="expandSidebar"
            :toggle-sidebar-collapsed="toggleSidebarCollapsed"
            :close-mobile-sidebar="closeMobileSidebar"
            :open-mobile-sidebar="openMobileSidebar"
            :toggle-mobile-sidebar="toggleMobileSidebar"
          />
        </div>
      </header>

      <main class="vf-admin-layout__content">
        <slot
          :is-sidebar-collapsed="isSidebarCollapsed"
          :is-sidebar-compact="isSidebarCompact"
          :is-mobile-sidebar-open="isMobileSidebarOpen"
          :collapse-sidebar="collapseSidebar"
          :expand-sidebar="expandSidebar"
          :toggle-sidebar-collapsed="toggleSidebarCollapsed"
          :close-mobile-sidebar="closeMobileSidebar"
          :open-mobile-sidebar="openMobileSidebar"
          :toggle-mobile-sidebar="toggleMobileSidebar"
        />
      </main>

      <footer v-if="hasFooter" class="vf-admin-layout__footer">
        <slot name="footer" />
      </footer>
    </div>
  </component>
</template>
