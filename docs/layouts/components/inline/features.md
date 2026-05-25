# Features

Inline layout primitive for horizontal groups with optional wrapping.

## Import

Import statement for this component.

```ts
import { VfInline } from '@codemonster-ru/vueforge-layouts';
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
  <VfInline style="--vf-layout-space-layout-base: var(--vf-surface-gap-compact)">
    <VfTag>Vue</VfTag>
    <VfTag>Vite</VfTag>
    <VfTag>TypeScript</VfTag>
  </VfInline>
</template>

<script setup>
import { VfInline } from '@codemonster-ru/vueforge-layouts';
import { VfTag } from '@codemonster-ru/vueforge-core';
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Inline layout groups items horizontally but should preserve underlying semantics of each item.
- Keep inline groups short and clearly labeled when they represent a single logical control group.
- Ensure wrapping does not break label-control relationships.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Inline wrapper is not focusable by default; focus moves through child controls in order. |
