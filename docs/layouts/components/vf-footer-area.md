---
title: "VfFooterArea"
description: "Component documentation for VfFooterArea"
slug: "/vueforge/layouts/components/vf-footer-area"
order: 24
---

# VfFooterArea

## Import

```ts
import { VfFooterArea } from '@codemonster-ru/vueforge-layouts';
```

## Summary

Footer area for page-level meta and secondary links.

## Key Props

- `as?: string` (default: `footer`)

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
  <VfFooterArea style="padding:10px;border:1px solid #e5e7eb;border-radius:10px">
    <small>© 2026 VueForge Docs</small>
  </VfFooterArea>
</template>

<script setup>
import { VfFooterArea } from '@codemonster-ru/vueforge-layouts';
</script>
```
````
