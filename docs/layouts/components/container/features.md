# Features

Centers and constrains content width for page sections.

## Import

Import statement for this component.

```ts
import { VfContainer } from '@codemonster-ru/vueforge-layouts';
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
  <VfContainer size="xl">
    <div style="padding:var(--vf-surface-padding-compact);border:1px solid var(--vf-color-border);border-radius:var(--vf-radius-control)">
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

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Container is a layout primitive and should not override semantics of child content.
- Use landmarks/headings in contained content to provide navigational structure.
- Avoid adding non-semantic wrappers that interrupt meaningful reading order.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Container itself is not focusable by default; focus moves to interactive descendants. |

