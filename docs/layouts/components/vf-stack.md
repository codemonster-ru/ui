---
title: "VfStack"
description: "Vertical spacing primitive"
slug: "/vueforge/layouts/components/vf-stack"
order: 2
---

# VfStack

Vertical layout primitive with configurable gaps between children.

## Summary

Vertical layout primitive with configurable gaps between children.

## Import

```ts
import { VfStack } from '@codemonster-ru/vueforge-layouts';
```

## Key Props

- `as?: string` (default: `div`)

## Slots

- `default`: stack items.

## Usage

````playground-src
mode: component
framework: vue
height: 240
entry: /App.vue

```vue file=/App.vue
<template>
  <VfStack style="gap:10px">
    <div style="padding:8px;border:1px solid #d1d5db;border-radius:8px">Block A</div>
    <div style="padding:8px;border:1px solid #d1d5db;border-radius:8px">Block B</div>
    <div style="padding:8px;border:1px solid #d1d5db;border-radius:8px">Block C</div>
  </VfStack>
</template>

<script setup>
import { VfStack } from '@codemonster-ru/vueforge-layouts';
</script>
```
````
