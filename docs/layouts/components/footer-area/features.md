# Features

Footer area for page-level meta and secondary links.

## Import

Import statement for this component.

```ts
import { VfFooterArea } from '@codemonster-ru/vueforge-layouts';
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
  <VfFooterArea style="padding:var(--vf-surface-gap);border:1px solid var(--vf-color-border);border-radius:var(--vf-radius-control)">
    <small>© 2026 VueForge Docs</small>
  </VfFooterArea>
</template>

<script setup>
import { VfFooterArea } from '@codemonster-ru/vueforge-layouts';
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Footer area should contain supporting navigation and metadata in semantic structure.
- Group related links and label sections where needed.
- Keep repeated links concise and meaningful out of context.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Footer area is not focusable by default; focus moves through footer links/actions. |

