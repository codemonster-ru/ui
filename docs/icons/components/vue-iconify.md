---
title: "VueIconify"
description: "Universal icon rendering component"
slug: "/vueforge/icons/components/vue-iconify"
order: 1
---

# VueIconify

Renders icons from the VueForge icon set via a unified API.

## Summary

Renders icons from the VueForge icon set via a unified API.

## Import

```ts
import { VueIconify } from '@codemonster-ru/vueforge-icons';
```

## Key Props

- `icon?: IconName | string` (default fallback: `moon`)
- `size?: number | string` (default: `var(--vf-icon-size-md)`)
- `spin?: boolean` (default: `false`)
- `style?: 'solid'` (default: `solid`)
- `inset?: number` (default: `0`)

## Notes

- Unknown icon names fallback safely to `moon`.
- Kebab-case icon names are normalized to component file names.
- `inset` adjusts visual scale and is clamped to a safe range.

## Usage

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <div style="display:flex;gap:12px;font-size:24px;align-items:center">
    <VueIconify icon="github" />
    <VueIconify icon="sparkles" spin />
    <VueIconify icon="arrowRightLong" />
  </div>
</template>

<script setup>
import { VueIconify } from '@codemonster-ru/vueforge-icons';
</script>
```
````
