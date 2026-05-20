# Features

## Summary

Page header area with optional sticky behavior.

## Import

```ts
import { VfHeaderArea } from '@codemonster-ru/vueforge-layouts';
```

## Basic

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <VfHeaderArea :sticky="false" style="padding:10px;border:1px solid #e5e7eb;border-radius:10px">
    <strong>Docs Header</strong>
  </VfHeaderArea>
</template>

<script setup>
import { VfHeaderArea } from '@codemonster-ru/vueforge-layouts';
</script>
```
````

## Accessibility

### Screen Reader

- Header area should group top-level navigation/branding/actions semantically.
- Include labeled landmarks in header content when navigation or utility controls are present.
- Ensure heading/logo link text communicates destination clearly.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Header area is not focusable by default; focus moves through header controls/links. |

