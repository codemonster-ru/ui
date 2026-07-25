# Features

`VfAdminLayout` provides the styled frame for an administrative interface. It fills the viewport with a fixed full-height aside and a fixed header in the right column. Main content begins below the header, while the footer is pushed to the bottom when content is short.

The component does not include a logo, navigation items, buttons, or page content. Supply those through slots to keep the layout reusable across applications.

## Built-in structure

- The `brand` slot occupies the top of the aside and exactly matches the header height through `--vf-layout-header-height`; padding and borders are included in that shared size.
- When both `brand` and `aside` are present, a divider separates the brand from navigation.
- The aside has a border on its right edge; the header and footer have horizontal borders.
- The `aside` and `header` remain fixed while the page content scrolls.
- The sidebar can be collapsed manually to `--vf-layout-admin-layout-sidebar-collapsed-width`, freeing horizontal space for the main column. Its `4.75rem` default accommodates the regular sidebar padding and an icon-only `VfNavMenu` item.
- A collapsed sidebar temporarily expands over the page on hover or keyboard focus and collapses again when interaction leaves it. This preview does not change the persisted collapsed state.
- `VfNavMenu` with `variant="sidebar"` adapts to the aside's actual width, showing top-level icons while collapsed and restoring the complete navigation during hover or focus preview.
- Below the `lg` breakpoint of the layout's own container, the aside becomes a closed off-canvas drawer. The built-in bars button, backdrop, and Escape key control its independent mobile state.
- Applications provide the centered mobile logo through `mobile-brand` and keep account controls or other trailing content in `header`. The bars button can be replaced through `mobile-toggle`.
- Desktop collapsed state is preserved across breakpoints but does not compact the mobile drawer. An
  opened mobile drawer always presents the complete brand and navigation.
- The layout owns the responsive placement and built-in toggle. Applications own the brand, menu,
  trailing header content, and may control either desktop or mobile state with `v-model`.
- The content area uses the setup-layout background token, so setup and admin screens share the same base surface.

## Import

```ts
import { VfAdminLayout } from '@codemonster-ru/vueforge-layouts';
```

## Basic

````playground-src
mode: component
framework: vue
height: 420
entry: /App.vue

```vue file=/App.vue
<template>
  <VfAdminLayout
    v-model:sidebar-collapsed="sidebarCollapsed"
    v-model:mobile-sidebar-open="mobileSidebarOpen"
  >
    <template #brand>
      <div class="app-brand">
        <span aria-hidden="true">◆</span>
        <span class="app-brand__label">Acme CMS</span>
      </div>
    </template>
    <template #mobile-brand>
      <span class="mobile-brand">
        <span aria-hidden="true">◆</span>
        <strong>Acme CMS</strong>
      </span>
    </template>
    <template #header="{ toggleSidebarCollapsed }">
      <button class="desktop-sidebar-toggle" type="button" @click="toggleSidebarCollapsed">
        {{ sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation' }}
      </button>
      <span>Administration</span>
    </template>
    <template #aside="{ closeMobileSidebar }">
      <nav>
        <a href="/dashboard" @click="closeMobileSidebar">Dashboard</a>
        <a href="/posts" @click="closeMobileSidebar">Posts</a>
      </nav>
    </template>

    <h1>Dashboard</h1>
    <p>Overview of your workspace.</p>

    <template #footer>© 2026 Acme CMS</template>
  </VfAdminLayout>
</template>

<script setup>
import { ref } from 'vue';
import { VfAdminLayout } from '@codemonster-ru/vueforge-layouts';

const sidebarCollapsed = ref(false);
const mobileSidebarOpen = ref(false);
</script>

<style scoped>
.app-brand {
  display: flex;
  align-items: center;
  gap: var(--vf-nav-menu-item-gap);
  width: 100%;
  padding-inline-start: calc(
    var(--vf-field-padding-inline-md) +
      (var(--vf-nav-menu-leading-icon-column-size) - var(--vf-icon-size-xl)) / 2
  );
}

.app-brand__label {
  min-width: 0;
  max-width: var(--vf-nav-menu-sidebar-label-max-width);
  overflow: hidden;
  opacity: 1;
  white-space: nowrap;
  transition:
    max-width var(--vf-motion-duration-normal) var(--vf-motion-ease-standard),
    opacity var(--vf-motion-duration-fast) var(--vf-motion-ease-standard);
}

.vf-admin-layout--sidebar-compact .app-brand__label {
  max-width: var(--vf-layout-size-zero);
  opacity: 0;
}

@container vf-admin-layout (max-width: 1023.98px) {
  .desktop-sidebar-toggle {
    display: none;
  }

  .vf-admin-layout--sidebar-compact .app-brand__label {
    max-width: var(--vf-nav-menu-sidebar-label-max-width);
    opacity: 1;
  }
}

.mobile-brand {
  display: inline-flex;
  align-items: center;
  gap: var(--vf-surface-gap-compact);
  white-space: nowrap;
}
</style>
```
````
