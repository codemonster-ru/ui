---
title: "VfThemeSwitch"
description: "Component documentation for VfThemeSwitch"
slug: "/vueforge/core/components/vf-theme-switch"
order: 36
---

# VfThemeSwitch

## Import

```ts
import { VfThemeSwitch } from '@codemonster-ru/vueforge-core';
```

## Summary

Theme toggle component with `switch` and `button` variants.

## Key Props

- `variant?: 'switch' | 'button'` (default: `switch`)
- `size?: VfControlSize` (default: `md`)
- `disabled?: boolean` (default: `false`)
- `label?: string`
- `thumbContrast?: VfSwitchThumbContrast` (default: `auto`)

## Slots

- `default`: custom label.
- `thumb`: custom thumb content for `switch` variant.

## Usage

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <div style="display:flex;gap:12px;align-items:center">
    <VfThemeSwitch label="Theme" />
    <VfThemeSwitch variant="button">Toggle Theme</VfThemeSwitch>
  </div>
</template>

<script setup>
import { VfThemeSwitch } from '@codemonster-ru/vueforge-core';
</script>
```
````
