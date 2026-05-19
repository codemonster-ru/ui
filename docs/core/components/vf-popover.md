---
title: "VfPopover"
description: "Component documentation for VfPopover"
slug: "/vueforge/core/components/vf-popover"
order: 19
---

# VfPopover

## Import

```ts
import { VfPopover } from '@codemonster-ru/vueforge-core';
```

## Summary

Floating popover container with controlled/uncontrolled open state.

## Key Props

- `open?: boolean`
- `defaultOpen?: boolean` (default: `false`)
- `placement?: VfDropdownPlacement` (default: `bottom-start`)
- `closeOnOutsideClick?: boolean` (default: `true`)
- `closeOnEscape?: boolean` (default: `true`)
- `teleportTo?: string | HTMLElement | null | false`
- `disableTeleport?: boolean` (default: `false`)

## Emits

- `update:open`
- `openChange`

## Slots

- `trigger`: trigger content (`{ open, toggle }`).
- `default`: popover content (`{ open, close }`).

## Usage

````playground-src
mode: component
framework: vue
height: 320
entry: /App.vue

```vue file=/App.vue
<template>
  <VfPopover placement="bottom-start">
    <template #trigger="{ open }">
      <button class="demo-trigger">{{ open ? 'Hide' : 'Show' }} details</button>
    </template>

    <div style="min-width:220px;padding:6px">
      <h4 style="margin:0 0 8px">Popover title</h4>
      <p style="margin:0;color:#4b5563">Short contextual help or quick actions.</p>
    </div>
  </VfPopover>
</template>

<script setup>
import { VfPopover } from '@codemonster-ru/vueforge-core';
</script>

<style>
.demo-trigger {
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 8px 12px;
  background: white;
  cursor: pointer;
}
</style>
```
````
