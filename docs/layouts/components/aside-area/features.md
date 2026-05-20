# Features

## Summary

Secondary aside region for contextual content near the main article.

## Import

```ts
import { VfAsideArea } from '@codemonster-ru/vueforge-layouts';
```

## Basic

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <VfAsideArea style="border:1px solid #e5e7eb;border-radius:10px">
    <p style="margin:0">Tip: Use keyboard shortcuts to speed up navigation.</p>
  </VfAsideArea>
</template>

<script setup>
import { VfAsideArea } from '@codemonster-ru/vueforge-layouts';
</script>
```
````

## Accessibility

### Screen Reader

- Aside area should host complementary content with clear headings/labels.
- Keep complementary info distinct from primary flow while preserving logical reading order.
- Avoid relying on visual position alone to communicate relation to main content.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Aside area is not focusable by default; focus moves to interactive descendants. |

