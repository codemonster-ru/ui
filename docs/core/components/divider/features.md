# Features

## Summary

Visual separator with horizontal and vertical orientations.

## Import

```ts
import { VfDivider } from '@codemonster-ru/vueforge-core';
```

## Basic

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <div style="display:flex;align-items:center;gap:12px">
    <span>Start</span>
    <VfDivider orientation="vertical" style="height:20px" />
    <span>End</span>
  </div>
</template>

<script setup>
import { VfDivider } from '@codemonster-ru/vueforge-core';
</script>
```
````

## Accessibility

### Screen Reader

- Divider is decorative/structural and should not interrupt reading flow with unnecessary verbosity.
- For semantic section separators, rely on heading structure in addition to visual separators.
- Use orientation consistently so visual and structural grouping stay aligned.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Divider is not focusable by default. |

