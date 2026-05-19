---
title: "VfAsideArea"
description: "Component documentation for VfAsideArea"
slug: "/vueforge/layouts/components/vf-aside-area"
order: 23
---

# VfAsideArea

## Import

```ts
import { VfAsideArea } from '@codemonster-ru/vueforge-layouts';
```

## Summary

Secondary aside region for contextual content near the main article.

## Key Props

- `as?: string` (default: `aside`)
- `appearance?: 'default' | 'plain'` (default: `default`)

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
  <VfAsideArea style="border:1px solid #e5e7eb;border-radius:10px">
    <p style="margin:0">Tip: Use keyboard shortcuts to speed up navigation.</p>
  </VfAsideArea>
</template>

<script setup>
import { VfAsideArea } from '@codemonster-ru/vueforge-layouts';
</script>
```
````
