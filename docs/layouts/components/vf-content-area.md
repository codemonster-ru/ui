---
title: "VfContentArea"
description: "Component documentation for VfContentArea"
slug: "/vueforge/layouts/components/vf-content-area"
order: 22
---

# VfContentArea

## Import

```ts
import { VfContentArea } from '@codemonster-ru/vueforge-layouts';
```

## Summary

Main content region with optional built-in padding.

## Key Props

- `as?: string` (default: `main`)
- `padded?: boolean` (default: `true`)

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
  <VfContentArea style="border:1px solid #e5e7eb;border-radius:10px">
    <p style="margin:0">Article content goes here.</p>
  </VfContentArea>
</template>

<script setup>
import { VfContentArea } from '@codemonster-ru/vueforge-layouts';
</script>
```
````
