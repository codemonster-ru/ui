---
title: "VfIconButton"
description: "Component documentation for VfIconButton"
slug: "/vueforge/core/components/vf-icon-button"
order: 24
---

# VfIconButton

## Import

```ts
import { VfIconButton } from '@codemonster-ru/vueforge-core';
```

## Summary

Icon-only button for compact actions in toolbars and controls.

## Key Props

- `icon: IconName | string` (required)
- `variant?: VfButtonVariant` (default: `ghost`)
- `size?: VfControlSize` (default: `md`)
- `type?: 'button' | 'submit' | 'reset'` (default: `button`)

## Slots

- No slots.

## Usage

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <div style="display:flex;gap:10px;align-items:center">
    <VfIconButton :icon="icons.magnifyingGlass" aria-label="Search" />
    <VfIconButton :icon="icons.gear" variant="secondary" aria-label="Settings" />
  </div>
</template>

<script setup>
import { icons } from '@codemonster-ru/vueforge-icons';
import { VfIconButton } from '@codemonster-ru/vueforge-core';
</script>
```
````
