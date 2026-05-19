---
title: "VfBreadcrumbs"
description: "Component documentation for VfBreadcrumbs"
slug: "/vueforge/core/components/vf-breadcrumbs"
order: 15
---

# VfBreadcrumbs

## Import

```ts
import { VfBreadcrumbs } from '@codemonster-ru/vueforge-core';
```

## Summary

Breadcrumb trail for hierarchical navigation.

## Key Props

- `items: VfBreadcrumbItem[]` (required)
- `ariaLabel?: string` (default: `Breadcrumb`)
- `component?: string | Component` (router-link override)

## Slots

- No public slots.

## Usage

````playground-src
mode: component
framework: vue
height: 240
entry: /App.vue

```vue file=/App.vue
<template>
  <VfBreadcrumbs :items="items" />
</template>

<script setup>
import { VfBreadcrumbs } from '@codemonster-ru/vueforge-core';

const items = [
  { label: 'Docs', href: '#' },
  { label: 'Core', href: '#' },
  { label: 'VfBreadcrumbs', current: true },
];
</script>
```
````
