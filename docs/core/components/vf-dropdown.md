---
title: "VfDropdown"
description: "Component documentation for VfDropdown"
slug: "/vueforge/core/components/vf-dropdown"
order: 12
---

# VfDropdown

## Import

```ts
import { VfDropdown } from '@codemonster-ru/vueforge-core';
```

## Summary

Menu dropdown with keyboard navigation and floating positioning.

## Key Props

- `open?: boolean`
- `defaultOpen?: boolean` (default: `false`)
- `placement?: VfDropdownPlacement` (default: `bottom-start`)
- `closeOnSelect?: boolean` (default: `true`)
- `variant?: 'default' | 'pills'` (default: `default`)
- `teleportTo?: string | HTMLElement | null | false`
- `disableTeleport?: boolean` (default: `false`)

## Emits

- `update:open`
- `openChange`

## Slots

- `trigger`: trigger node (`{ open, toggle }`).
- `default`: menu body (`{ close, open }`).

## Usage

````playground-src
mode: component
framework: vue
height: 280
entry: /App.vue

```vue file=/App.vue
<template>
  <VfDropdown>
    <template #trigger="{ open }">
      <button class="demo-trigger">{{ open ? 'Close' : 'Open' }} menu</button>
    </template>

    <div style="display:flex;flex-direction:column;gap:6px;min-width:180px">
      <button role="menuitem" class="demo-item">Profile</button>
      <button role="menuitem" class="demo-item">Billing</button>
      <button role="menuitem" class="demo-item">Sign out</button>
    </div>
  </VfDropdown>
</template>

<script setup>
import { VfDropdown } from '@codemonster-ru/vueforge-core';
</script>

<style>
.demo-trigger {
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 8px 12px;
  background: white;
  cursor: pointer;
}

.demo-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 10px;
  background: white;
  text-align: left;
  cursor: pointer;
}
</style>
```
````
