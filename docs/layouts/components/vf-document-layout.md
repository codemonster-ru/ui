---
title: "VfDocumentLayout"
description: "Document-oriented layout component"
slug: "/vueforge/layouts/components/vf-document-layout"
order: 5
---

# VfDocumentLayout

Layout shell for documentation-like pages with content-first structure.

## Summary

Layout shell for documentation-like pages with content-first structure.

## Import

```ts
import { VfDocumentLayout } from '@codemonster-ru/vueforge-layouts';
```

## Key Props

- `layout?: 'content' | 'sidebar-content' | 'sidebar-content-aside'` (default: `content`)
- `fillViewport?: boolean`
- `edgeNotches?: boolean`
- `showSubheader?: boolean`
- `showContentSubheader?: boolean`
- `stickyHeader?: boolean`
- `stickySidebar?: boolean`
- `stickyAside?: boolean`

## Slots

- `header`
- `subheader`
- `sidebar`
- `content-subheader`
- `default`
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
  <VfDocumentLayout layout="sidebar-content">
    <template #header><div style="padding:8px;border:1px solid #d1d5db">Doc Header</div></template>
    <template #sidebar><div style="padding:8px;border:1px solid #d1d5db">TOC</div></template>
    <div style="padding:8px;border:1px solid #d1d5db">Article body</div>
  </VfDocumentLayout>
</template>

<script setup>
import { VfDocumentLayout } from '@codemonster-ru/vueforge-layouts';
</script>
```
````
