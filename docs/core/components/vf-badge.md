---
title: "VfBadge"
description: "Component documentation for VfBadge"
slug: "/vueforge/core/components/vf-badge"
order: 3
---

# VfBadge

## Import

```ts
import { VfBadge } from '@codemonster-ru/vueforge-core';
```

## Summary

Inline status/count badge.

## Key Props

- `tone?: VfBadgeTone` (default: `neutral`)

## Slots

- `default`: badge content.

## Usage

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <div style="display:flex;gap:8px;flex-wrap:wrap">
    <VfBadge>Neutral</VfBadge>
    <VfBadge tone="info">Info</VfBadge>
    <VfBadge tone="success">Success</VfBadge>
  </div>
</template>

<script setup>
import { VfBadge } from '@codemonster-ru/vueforge-core';
</script>
```
````
