---
title: "VfHeaderArea"
description: "Component documentation for VfHeaderArea"
slug: "/vueforge/layouts/components/vf-header-area"
order: 20
---

# VfHeaderArea

## Import

```ts
import { VfHeaderArea } from '@codemonster-ru/vueforge-layouts';
```

## Summary

Page header area with optional sticky behavior.

## Key Props

- `as?: string` (default: `header`)
- `sticky?: boolean` (default: `true`)

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
  <VfHeaderArea :sticky="false" style="padding:10px;border:1px solid #e5e7eb;border-radius:10px">
    <strong>Docs Header</strong>
  </VfHeaderArea>
</template>

<script setup>
import { VfHeaderArea } from '@codemonster-ru/vueforge-layouts';
</script>
```
````
