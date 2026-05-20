# Features

Vertical layout primitive with configurable gaps between children.

## Summary

Vertical layout primitive with configurable gaps between children.

## Import

```ts
import { VfStack } from '@codemonster-ru/vueforge-layouts';
```

## Basic

````playground-src
mode: component
framework: vue
height: 240
entry: /App.vue

```vue file=/App.vue
<template>
  <VfStack style="gap:10px">
    <div style="padding:8px;border:1px solid #d1d5db;border-radius:8px">Block A</div>
    <div style="padding:8px;border:1px solid #d1d5db;border-radius:8px">Block B</div>
    <div style="padding:8px;border:1px solid #d1d5db;border-radius:8px">Block C</div>
  </VfStack>
</template>

<script setup>
import { VfStack } from '@codemonster-ru/vueforge-layouts';
</script>
```
````

## Accessibility

### Screen Reader

- Stack controls spacing only; it should not change semantics of stacked children.
- Preserve child DOM order because it defines reading and focus order.
- Use semantic elements inside stack (lists, sections, forms) when structure is meaningful.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Stack is not focusable by default; focus follows child interactive elements in DOM order. |

