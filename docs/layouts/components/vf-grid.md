---
title: "VfGrid"
description: "Responsive grid primitive"
slug: "/vueforge/layouts/components/vf-grid"
order: 3
---

# VfGrid

Grid primitive for responsive multi-column layouts.

## Summary

Grid primitive for responsive multi-column layouts.

## Import

```ts
import { VfGrid } from '@codemonster-ru/vueforge-layouts';
```

## Key Props

- `as?: string` (default: `div`)

## Slots

- `default`: grid cells.

## Usage

````playground-src
mode: component
framework: vue
height: 250
entry: /App.vue

```vue file=/App.vue
<template>
  <VfGrid style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">
    <div style="padding:8px;border:1px solid #d1d5db;border-radius:8px">Cell 1</div>
    <div style="padding:8px;border:1px solid #d1d5db;border-radius:8px">Cell 2</div>
    <div style="padding:8px;border:1px solid #d1d5db;border-radius:8px">Cell 3</div>
    <div style="padding:8px;border:1px solid #d1d5db;border-radius:8px">Cell 4</div>
  </VfGrid>
</template>

<script setup>
import { VfGrid } from '@codemonster-ru/vueforge-layouts';
</script>
```
````
