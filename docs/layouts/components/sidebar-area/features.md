# Features

## Summary

Sidebar region for navigation trees and supporting controls.

## Import

```ts
import { VfSidebarArea } from '@codemonster-ru/vueforge-layouts';
```

## Basic

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <VfSidebarArea style="border:1px solid #e5e7eb;border-radius:10px">
    <nav style="display:grid;gap:6px">
      <a href="#intro">Introduction</a>
      <a href="#install">Installation</a>
      <a href="#api">API</a>
    </nav>
  </VfSidebarArea>
</template>

<script setup>
import { VfSidebarArea } from '@codemonster-ru/vueforge-layouts';
</script>
```
````

## Accessibility

### Screen Reader

- Sidebar area is a structural region; preserve semantic grouping of navigation/filters/widgets.
- Provide labels/headings for sidebar subsections to improve screen reader scanning.
- Ensure collapsed/expanded states of nested controls inside sidebar are announced by those controls.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Sidebar area is not focusable by default; focus moves through interactive descendants. |

