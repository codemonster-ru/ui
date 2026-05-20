# Features

## Summary

Inline status/count badge.

## Import

```ts
import { VfBadge } from '@codemonster-ru/vueforge-core';
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
    <VfBadge>Neutral</VfBadge>
    <VfBadge tone="info">Info</VfBadge>
    <VfBadge tone="success">Success</VfBadge>
  </div>
</template>

<script setup>
import { VfBadge } from '@codemonster-ru/vueforge-core';
</script>
```
````

## Accessibility

### Screen Reader

- Badges are typically supplemental; do not rely on color alone to convey meaning.
- Ensure critical status text is present in readable text, not only decorative badge visuals.
- If badge updates dynamically and is important, pair with an announced text update in surrounding UI.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Not focusable by default unless badge wraps an interactive element. |

