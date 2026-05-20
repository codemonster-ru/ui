# Features

Layout shell for documentation-like pages with content-first structure.

## Summary

Layout shell for documentation-like pages with content-first structure.

## Import

```ts
import { VfDocumentLayout } from '@codemonster-ru/vueforge-layouts';
```

## Basic

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

## Accessibility

### Screen Reader

- Document layout should expose a clear page structure (header, main content, side content, footer where applicable).
- Preserve heading hierarchy and landmark clarity across composed regions.
- Ensure side rails and supplementary regions are labeled when they contain navigable controls.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Layout wrapper is not focusable by default; focus moves through interactive descendants by DOM order. |

