# Features

Secondary aside region for contextual content near the main article.

## Import

Import statement for this component.

```ts
import { VfAsideArea } from '@codemonster-ru/vueforge-layouts';
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
  <VfAsideArea style="border:1px solid var(--vf-color-border);border-radius:var(--vf-radius-control)">
    <p style="margin:0">Tip: Use keyboard shortcuts to speed up navigation.</p>
  </VfAsideArea>
</template>

<script setup>
import { VfAsideArea } from '@codemonster-ru/vueforge-layouts';
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Aside area should host complementary content with clear headings/labels.
- Keep complementary info distinct from primary flow while preserving logical reading order.
- Avoid relying on visual position alone to communicate relation to main content.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Aside area is not focusable by default; focus moves to interactive descendants. |

