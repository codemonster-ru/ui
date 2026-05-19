---
title: "VfLink"
description: "Component documentation for VfLink"
slug: "/vueforge/core/components/vf-link"
order: 15
---

# VfLink

## Import

```ts
import { VfLink } from '@codemonster-ru/vueforge-core';
```

## Summary

Navigation link component for anchor and router-link modes.

## Key Props

- `href?: string`
- `to?: string | Record<string, unknown>`
- `target?: string`
- `rel?: string`
- `underline?: VfLinkUnderline` (default: `none`)
- `tone?: VfLinkTone` (default: `default`)
- `component?: string | Component` (router-link override)

## Notes

- If `to` is set, component switches to router-link mode.
- When `target=\"_blank\"` and `rel` is omitted, safe rel is applied automatically.

## Usage

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
    <VfLink href="https://github.com/primefaces/primevue" target="_blank">
      PrimeVue
    </VfLink>
    <VfLink href="#api" underline="always" tone="muted">
      API section
    </VfLink>
  </div>
</template>

<script setup>
import { VfLink } from '@codemonster-ru/vueforge-core';
</script>
```
````
