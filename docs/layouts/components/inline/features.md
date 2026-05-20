# Features

## Summary

Inline layout primitive for horizontal groups with optional wrapping.

## Import

```ts
import { VfInline } from '@codemonster-ru/vueforge-layouts';
```

## Basic

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <VfInline style="display:flex;gap:8px">
    <span style="padding:4px 8px;border:1px solid #d1d5db;border-radius:8px">Vue</span>
    <span style="padding:4px 8px;border:1px solid #d1d5db;border-radius:8px">Vite</span>
    <span style="padding:4px 8px;border:1px solid #d1d5db;border-radius:8px">TypeScript</span>
  </VfInline>
</template>

<script setup>
import { VfInline } from '@codemonster-ru/vueforge-layouts';
</script>
```
````

## Accessibility

### Screen Reader

- Inline layout groups items horizontally but should preserve underlying semantics of each item.
- Keep inline groups short and clearly labeled when they represent a single logical control group.
- Ensure wrapping does not break label-control relationships.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Inline wrapper is not focusable by default; focus moves through child controls in order. |

