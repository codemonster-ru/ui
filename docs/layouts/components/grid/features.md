# Features

Grid primitive for responsive multi-column layouts.

## Import

Import statement for this component.

```ts
import { VfGrid } from '@codemonster-ru/vueforge-layouts';
```

## Basic

Basic usage example.

````playground-src
mode: component
framework: vue
height: 250
entry: /App.vue

```vue file=/App.vue
<template>
  <VfGrid style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--vf-surface-gap)">
    <div style="padding:var(--vf-surface-gap-compact);border:1px solid var(--vf-color-border);border-radius:var(--vf-radius-control)">Cell 1</div>
    <div style="padding:var(--vf-surface-gap-compact);border:1px solid var(--vf-color-border);border-radius:var(--vf-radius-control)">Cell 2</div>
    <div style="padding:var(--vf-surface-gap-compact);border:1px solid var(--vf-color-border);border-radius:var(--vf-radius-control)">Cell 3</div>
    <div style="padding:var(--vf-surface-gap-compact);border:1px solid var(--vf-color-border);border-radius:var(--vf-radius-control)">Cell 4</div>
  </VfGrid>
</template>

<script setup>
import { VfGrid } from '@codemonster-ru/vueforge-layouts';
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Grid primitive controls visual placement; semantic meaning must come from child elements.
- Preserve DOM order aligned with intended reading/navigation order, especially in responsive layouts.
- Do not use visual column placement as the only way to express relationships.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Grid wrapper is not focusable by default; focus moves through interactive descendants in DOM order. |

