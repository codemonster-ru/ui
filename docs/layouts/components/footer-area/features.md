# Features

## Summary

Footer area for page-level meta and secondary links.

## Import

```ts
import { VfFooterArea } from '@codemonster-ru/vueforge-layouts';
```

## Basic

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <VfFooterArea style="padding:10px;border:1px solid #e5e7eb;border-radius:10px">
    <small>© 2026 VueForge Docs</small>
  </VfFooterArea>
</template>

<script setup>
import { VfFooterArea } from '@codemonster-ru/vueforge-layouts';
</script>
```
````

## Accessibility

### Screen Reader

- Footer area should contain supporting navigation and metadata in semantic structure.
- Group related links and label sections where needed.
- Keep repeated links concise and meaningful out of context.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Footer area is not focusable by default; focus moves through footer links/actions. |

