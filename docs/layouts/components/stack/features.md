# Features

Vertical layout primitive with configurable gaps between children.

## Import

Import statement for this component.

```ts
import { VfStack } from '@codemonster-ru/vueforge-layouts';
```

## Basic

Basic usage example.

````playground-src
mode: component
framework: vue
height: 240
entry: /App.vue

```vue file=/App.vue
<template>
  <VfStack style="gap:var(--vf-surface-gap)">
    <div style="padding:var(--vf-surface-gap-compact);border:1px solid var(--vf-color-border);border-radius:var(--vf-radius-control)">Block A</div>
    <div style="padding:var(--vf-surface-gap-compact);border:1px solid var(--vf-color-border);border-radius:var(--vf-radius-control)">Block B</div>
    <div style="padding:var(--vf-surface-gap-compact);border:1px solid var(--vf-color-border);border-radius:var(--vf-radius-control)">Block C</div>
  </VfStack>
</template>

<script setup>
import { VfStack } from '@codemonster-ru/vueforge-layouts';
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Stack controls spacing only; it should not change semantics of stacked children.
- Preserve child DOM order because it defines reading and focus order.
- Use semantic elements inside stack (lists, sections, forms) when structure is meaningful.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Stack is not focusable by default; focus follows child interactive elements in DOM order. |

