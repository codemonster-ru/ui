# Features

Layout shell for documentation-like pages with content-first structure.

## Import

Import statement for this component.

```ts
import { VfDocumentLayout } from '@codemonster-ru/vueforge-layouts';
```

## Basic

Basic usage example.

````playground-src
mode: component
framework: vue
height: 320
entry: /App.vue

```vue file=/App.vue
<template>
  <VfDocumentLayout layout="sidebar-content">
    <template #header><div style="padding:var(--vf-surface-gap-compact);border:1px solid var(--vf-color-border)">Doc Header</div></template>
    <template #sidebar><div style="padding:var(--vf-surface-gap-compact);border:1px solid var(--vf-color-border)">TOC</div></template>
    <div style="padding:var(--vf-surface-gap-compact);border:1px solid var(--vf-color-border)">Article body</div>
  </VfDocumentLayout>
</template>

<script setup>
import { VfDocumentLayout } from '@codemonster-ru/vueforge-layouts';
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Document layout should expose a clear page structure (header, main content, side content, footer where applicable).
- Preserve heading hierarchy and landmark clarity across composed regions.
- Ensure side rails and supplementary regions are labeled when they contain navigable controls.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Layout wrapper is not focusable by default; focus moves through interactive descendants by DOM order. |

