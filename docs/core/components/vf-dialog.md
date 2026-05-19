---
title: "VfDialog"
description: "Modal dialog component"
slug: "/vueforge/core/components/vf-dialog"
order: 4
---

# VfDialog

Overlay dialog for confirmations and focused workflows.

## Summary

Overlay dialog for confirmations and focused workflows.

## Import

```ts
import { VfDialog } from '@codemonster-ru/vueforge-core';
```

## Key Props

- `open?: boolean`
- `defaultOpen?: boolean` (default: `false`)
- `title?: string`
- `description?: string`
- `size?: VfDialogSize` (default: `md`)
- `dividers?: boolean` (default: `false`)
- `closeOnOverlayClick?: boolean` (default: `true`)
- `closeOnEscape?: boolean` (default: `true`)
- `closable?: boolean` (default: `true`)
- `teleportTo?: string | HTMLElement | null | false`
- `disableTeleport?: boolean` (default: `false`)

## Emits

- `update:open` with next dialog visibility state.
- `openChange` with next dialog visibility state.

## Slots

- `default`: dialog body (`{ close }` slot prop available).
- `header`
- `description`
- `actions` (`{ close }` slot prop available).
- `footer` (`{ close }` slot prop available).

## Usage

````playground-src
mode: component
framework: vue
height: 260
entry: /App.vue

```vue file=/App.vue
<template>
  <VfButton @click="open = true">Open Dialog</VfButton>
  <VfDialog v-model:open="open" title="Delete item?">
    This action cannot be undone.
  </VfDialog>
</template>

<script setup>
import { ref } from 'vue';
import { VfButton, VfDialog } from '@codemonster-ru/vueforge-core';

const open = ref(false);
</script>
```
````
