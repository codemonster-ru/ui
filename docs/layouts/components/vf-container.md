---
title: "VfContainer"
description: "Content width container primitive"
slug: "/vueforge/layouts/components/vf-container"
order: 1
---

# VfContainer

Centers and constrains content width for page sections.

## Summary

Centers and constrains content width for page sections.

## Import

```ts
import { VfContainer } from '@codemonster-ru/vueforge-layouts';
```

## Key Props

- `as?: string` (default: `div`)
- `size?: 'md' | 'lg' | 'xl' | '2xl'`
- `fluid?: boolean` (default: `false`)

## Slots

- `default`: container content.

## Usage

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <VfContainer size="xl">
    <div style="padding:12px;border:1px solid #d1d5db;border-radius:8px">
      Constrained content area
    </div>
  </VfContainer>
</template>

<script setup>
import { VfContainer } from '@codemonster-ru/vueforge-layouts';
</script>
```
````
