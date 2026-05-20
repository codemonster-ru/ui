# Features

Centers and constrains content width for page sections.

## Summary

Centers and constrains content width for page sections.

## Import

```ts
import { VfContainer } from '@codemonster-ru/vueforge-layouts';
```

## Basic

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <VfContainer size="xl">
    <div style="padding:12px;border:1px solid #d1d5db;border-radius:8px">
      Constrained content area
    </div>
  </VfContainer>
</template>

<script setup>
import { VfContainer } from '@codemonster-ru/vueforge-layouts';
</script>
```
````

## Accessibility

### Screen Reader

- Container is a layout primitive and should not override semantics of child content.
- Use landmarks/headings in contained content to provide navigational structure.
- Avoid adding non-semantic wrappers that interrupt meaningful reading order.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Container itself is not focusable by default; focus moves to interactive descendants. |

