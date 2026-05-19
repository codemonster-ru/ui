---
title: "VfDrawer"
description: "Component documentation for VfDrawer"
slug: "/vueforge/core/components/vf-drawer"
order: 20
---

# VfDrawer

## Import

```ts
import { VfDrawer } from '@codemonster-ru/vueforge-core';
```

## Summary

Sliding panel for secondary workflows and contextual actions.

## Key Props

- `open?: boolean`
- `defaultOpen?: boolean` (default: `false`)
- `title?: string`
- `size?: VfDrawerSize` (default: `md`)
- `placement?: VfDrawerPlacement` (default: `right`)
- `closeOnOverlayClick?: boolean` (default: `true`)
- `closeOnEscape?: boolean` (default: `true`)
- `closable?: boolean` (default: `true`)

## Slots

- `header`
- `actions`: gets `{ close }`
- `default`: body
- `footer`: gets `{ close }`

## Usage

````playground-src
mode: component
framework: vue
height: 360
entry: /App.vue

```vue file=/App.vue
<template>
  <VfDrawer v-model:open="open" title="Filters" size="sm">
    <p style="margin:0 0 12px">Update search filters for the list.</p>
    <template #footer="{ close }">
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button @click="close">Close</button>
      </div>
    </template>
  </VfDrawer>
</template>

<script setup>
import { ref } from 'vue';
import { VfDrawer } from '@codemonster-ru/vueforge-core';

const open = ref(true);
</script>
```
````
