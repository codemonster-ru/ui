---
title: "VfInline"
description: "Component documentation for VfInline"
slug: "/vueforge/layouts/components/vf-inline"
order: 14
---

# VfInline

## Import

```ts
import { VfInline } from '@codemonster-ru/vueforge-layouts';
```

## Summary

Inline layout primitive for horizontal groups with optional wrapping.

## Key Props

- `as?: string` (default: `div`)
- `wrap?: boolean` (default: `true`)

## Slots

- `default`

## Usage

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <VfInline style="display:flex;gap:8px">
    <span style="padding:4px 8px;border:1px solid #d1d5db;border-radius:8px">Vue</span>
    <span style="padding:4px 8px;border:1px solid #d1d5db;border-radius:8px">Vite</span>
    <span style="padding:4px 8px;border:1px solid #d1d5db;border-radius:8px">TypeScript</span>
  </VfInline>
</template>

<script setup>
import { VfInline } from '@codemonster-ru/vueforge-layouts';
</script>
```
````
