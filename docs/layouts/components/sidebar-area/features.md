# Features

Sidebar region for navigation trees and supporting controls.

## Import

Import statement for this component.

```ts
import { VfSidebarArea } from '@codemonster-ru/vueforge-layouts';
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
  <VfSidebarArea style="border:1px solid var(--vf-color-border);border-radius:var(--vf-radius-control)">
    <nav style="display:grid;gap:var(--vf-surface-gap-tight)">
      <VfLink href="#intro">Introduction</VfLink>
      <VfLink href="#install">Installation</VfLink>
      <VfLink href="#api">API</VfLink>
    </nav>
  </VfSidebarArea>
</template>

<script setup>
import { VfSidebarArea } from '@codemonster-ru/vueforge-layouts';
import { VfLink } from '@codemonster-ru/vueforge-core';
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Sidebar area is a structural region; preserve semantic grouping of navigation/filters/widgets.
- Provide labels/headings for sidebar subsections to improve screen reader scanning.
- Ensure collapsed/expanded states of nested controls inside sidebar are announced by those controls.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Sidebar area is not focusable by default; focus moves through interactive descendants. |
