# Features

Main content region with optional built-in padding.

## Import

Import statement for this component.

```ts
import { VfContentArea } from '@codemonster-ru/vueforge-layouts';
```

## Basic

Basic usage example.

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <VfContentArea style="border:1px solid var(--vf-color-border);border-radius:var(--vf-radius-control)">
    <p style="margin:0">Article content goes here.</p>
  </VfContentArea>
</template>

<script setup>
import { VfContentArea } from '@codemonster-ru/vueforge-layouts';
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Content area should preserve document flow and heading hierarchy for the main reading region.
- If used as a primary content landmark, label it appropriately in surrounding layout.
- Keep DOM order aligned with visual order to avoid navigation confusion.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Content area is not focusable by default; focus moves through interactive descendants. |

