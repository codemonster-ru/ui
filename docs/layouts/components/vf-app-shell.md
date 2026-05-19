---
title: "VfAppShell"
description: "Application shell layout component"
slug: "/vueforge/layouts/components/vf-app-shell"
order: 4
---

# VfAppShell

Top-level shell component for header/sidebar/content/footer composition.

## Summary

Top-level shell component for header/sidebar/content/footer composition.

## Import

```ts
import { VfAppShell } from '@codemonster-ru/vueforge-layouts';
```

## Key Props

- `layout?: 'content' | 'sidebar-content' | 'sidebar-content-aside'` (default: `sidebar-content-aside`)
- `fillViewport?: boolean`
- `stickyHeader?: boolean`
- `stickySidebar?: boolean`
- `stickyAside?: boolean`
- `sidebarCollapsed?: boolean`
- `defaultSidebarCollapsed?: boolean`
- `sidebarAppearance?: 'default' | 'plain'`
- `asideAppearance?: 'default' | 'plain'`
- `contentAppearance?: 'default' | 'plain'`

## Emits

- `update:sidebarCollapsed`

## Slots

- `header`
- `subheader`
- `sidebar` (`is-sidebar-collapsed`, `collapse-sidebar`, `expand-sidebar`, `toggle-sidebar-collapsed`)
- `content-subheader`
- `default` (`is-sidebar-collapsed`, `collapse-sidebar`, `expand-sidebar`, `toggle-sidebar-collapsed`)
- `aside`
- `footer`

## Usage

````playground-src
mode: component
framework: vue
height: 320
entry: /App.vue

```vue file=/App.vue
<template>
  <VfAppShell>
    <template #header><div style="padding:8px;border:1px solid #d1d5db">Header</div></template>
    <template #sidebar><div style="padding:8px;border:1px solid #d1d5db">Sidebar</div></template>
    <div style="padding:8px;border:1px solid #d1d5db">Main content</div>
    <template #aside><div style="padding:8px;border:1px solid #d1d5db">Aside</div></template>
    <template #footer><div style="padding:8px;border:1px solid #d1d5db">Footer</div></template>
  </VfAppShell>
</template>

<script setup>
import { VfAppShell } from '@codemonster-ru/vueforge-layouts';
</script>
```
````
