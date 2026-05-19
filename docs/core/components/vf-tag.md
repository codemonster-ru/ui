---
title: "VfTag"
description: "Component documentation for VfTag"
slug: "/vueforge/core/components/vf-tag"
order: 37
---

# VfTag

## Import

```ts
import { VfTag } from '@codemonster-ru/vueforge-core';
```

## Summary

Compact label for status, categories, and metadata.

## Key Props

- `tone?: VfFeedbackTone` (default: `neutral`)

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
  <div style="display:flex;gap:8px;flex-wrap:wrap">
    <VfTag>Default</VfTag>
    <VfTag tone="success">Stable</VfTag>
    <VfTag tone="warning">Beta</VfTag>
  </div>
</template>

<script setup>
import { VfTag } from '@codemonster-ru/vueforge-core';
</script>
```
````
