---
title: "VfSection"
description: "Component documentation for VfSection"
slug: "/vueforge/layouts/components/vf-section"
order: 15
---

# VfSection

## Import

```ts
import { VfSection } from '@codemonster-ru/vueforge-layouts';
```

## Summary

Section container with optional surface styling.

## Key Props

- `as?: string` (default: `section`)
- `surface?: boolean` (default: `false`)

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
  <VfSection surface style="padding:12px">
    <h3 style="margin:0 0 6px">Section title</h3>
    <p style="margin:0">Grouped content area with spacing and background surface.</p>
  </VfSection>
</template>

<script setup>
import { VfSection } from '@codemonster-ru/vueforge-layouts';
</script>
```
````
