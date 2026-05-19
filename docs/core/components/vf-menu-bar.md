---
title: "VfMenuBar"
description: "Component documentation for VfMenuBar"
slug: "/vueforge/core/components/vf-menu-bar"
order: 27
---

# VfMenuBar

## Import

```ts
import { VfMenuBar } from '@codemonster-ru/vueforge-core';
```

## Summary

Horizontal menu bar with nested items and keyboard navigation.

## Key Props

- `items: VfNavMenuItem[]` (required)
- `modelValue?: string`
- `defaultValue?: string`
- `ariaLabel?: string` (default: `Menu bar`)
- `variant?: 'default' | 'pills'` (default: `default`)

## Emits

- `update:modelValue`
- `change`
- `select`

## Slots

- No public slots. Structure is built from `items`.

## Usage

````playground-src
mode: component
framework: vue
height: 320
entry: /App.vue

```vue file=/App.vue
<template>
  <VfMenuBar :items="items" />
</template>

<script setup>
import { VfMenuBar } from '@codemonster-ru/vueforge-core';

const items = [
  { value: 'home', label: 'Home' },
  {
    value: 'products',
    label: 'Products',
    children: [
      { value: 'ui-kit', label: 'UI Kit' },
      { value: 'icons', label: 'Icons' },
    ],
  },
  { value: 'docs', label: 'Docs' },
];
</script>
```
````
