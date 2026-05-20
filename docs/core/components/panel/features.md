# Features

## Summary

Content container with optional title and custom header slot.

## Import

```ts
import { VfPanel } from '@codemonster-ru/vueforge-core';
```

## Basic

````playground-src
mode: component
framework: vue
height: 280
entry: /App.vue

```vue file=/App.vue
<template>
  <VfPanel title="Recent Activity">
    <ul style="margin:0;padding-left:18px">
      <li>Updated docs structure</li>
      <li>Added interactive examples</li>
    </ul>
  </VfPanel>
</template>

<script setup>
import { VfPanel } from '@codemonster-ru/vueforge-core';
</script>
```
````

## Accessibility

### Screen Reader

- Panel acts as a content region; include meaningful heading/title for context.
- Preserve semantic structure of content inside panel (headings, lists, forms).
- If panel header includes actions, ensure each action has explicit accessible labeling.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Moves focus through interactive controls inside panel. |
| `Shift + Tab` | Moves focus backward through panel controls. |

