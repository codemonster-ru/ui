---
title: "VfDivider"
description: "Component documentation for VfDivider"
slug: "/vueforge/core/components/vf-divider"
order: 22
---

# VfDivider

## Import

```ts
import { VfDivider } from '@codemonster-ru/vueforge-core';
```

## Summary

Visual separator with horizontal and vertical orientations.

## Key Props

- `orientation?: 'horizontal' | 'vertical'` (default: `horizontal`)

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
  <div style="display:flex;align-items:center;gap:12px">
    <span>Start</span>
    <VfDivider orientation="vertical" style="height:20px" />
    <span>End</span>
  </div>
</template>

<script setup>
import { VfDivider } from '@codemonster-ru/vueforge-core';
</script>
```
````
