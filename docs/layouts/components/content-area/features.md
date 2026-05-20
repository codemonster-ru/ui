# Features

## Summary

Main content region with optional built-in padding.

## Import

```ts
import { VfContentArea } from '@codemonster-ru/vueforge-layouts';
```

## Basic

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <VfContentArea style="border:1px solid #e5e7eb;border-radius:10px">
    <p style="margin:0">Article content goes here.</p>
  </VfContentArea>
</template>

<script setup>
import { VfContentArea } from '@codemonster-ru/vueforge-layouts';
</script>
```
````

## Accessibility

### Screen Reader

- Content area should preserve document flow and heading hierarchy for the main reading region.
- If used as a primary content landmark, label it appropriately in surrounding layout.
- Keep DOM order aligned with visual order to avoid navigation confusion.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Content area is not focusable by default; focus moves through interactive descendants. |

