# Features

Grid primitive for responsive multi-column layouts.

## Summary

Grid primitive for responsive multi-column layouts.

## Import

```ts
import { VfGrid } from '@codemonster-ru/vueforge-layouts';
```

## Basic

````playground-src
mode: component
framework: vue
height: 250
entry: /App.vue

```vue file=/App.vue
<template>
  <VfGrid style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">
    <div style="padding:8px;border:1px solid #d1d5db;border-radius:8px">Cell 1</div>
    <div style="padding:8px;border:1px solid #d1d5db;border-radius:8px">Cell 2</div>
    <div style="padding:8px;border:1px solid #d1d5db;border-radius:8px">Cell 3</div>
    <div style="padding:8px;border:1px solid #d1d5db;border-radius:8px">Cell 4</div>
  </VfGrid>
</template>

<script setup>
import { VfGrid } from '@codemonster-ru/vueforge-layouts';
</script>
```
````

## Accessibility

### Screen Reader

- Grid primitive controls visual placement; semantic meaning must come from child elements.
- Preserve DOM order aligned with intended reading/navigation order, especially in responsive layouts.
- Do not use visual column placement as the only way to express relationships.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Grid wrapper is not focusable by default; focus moves through interactive descendants in DOM order. |

