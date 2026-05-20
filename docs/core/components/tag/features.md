# Features

## Summary

Compact label for status, categories, and metadata.

## Import

```ts
import { VfTag } from '@codemonster-ru/vueforge-core';
```

## Basic

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <div style="display:flex;gap:8px;flex-wrap:wrap">
    <VfTag>Default</VfTag>
    <VfTag tone="success">Stable</VfTag>
    <VfTag tone="warning">Beta</VfTag>
  </div>
</template>

<script setup>
import { VfTag } from '@codemonster-ru/vueforge-core';
</script>
```
````

## Accessibility

### Screen Reader

- Tags should include readable text labels that describe category/state.
- For removable/interactive tags, provide explicit action labels for remove buttons.
- Do not encode semantic meaning by color alone.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Moves focus to interactive controls inside a tag (if present). |
| `Shift + Tab` | Moves focus backward through interactive controls. |
| `Enter` | Activates focused tag action where interactive controls are used. |

