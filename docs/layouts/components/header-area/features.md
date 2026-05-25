# Features

Page header area with optional sticky behavior.

## Import

Import statement for this component.

```ts
import { VfHeaderArea } from '@codemonster-ru/vueforge-layouts';
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
  <VfHeaderArea :sticky="false" style="padding:var(--vf-surface-gap);border:1px solid var(--vf-color-border);border-radius:var(--vf-radius-control)">
    <strong>Docs Header</strong>
  </VfHeaderArea>
</template>

<script setup>
import { VfHeaderArea } from '@codemonster-ru/vueforge-layouts';
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Header area should group top-level navigation/branding/actions semantically.
- Include labeled landmarks in header content when navigation or utility controls are present.
- Ensure heading/logo link text communicates destination clearly.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Header area is not focusable by default; focus moves through header controls/links. |

