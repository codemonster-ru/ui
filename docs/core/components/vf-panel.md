---
title: "VfPanel"
description: "Component documentation for VfPanel"
slug: "/vueforge/core/components/vf-panel"
order: 29
---

# VfPanel

## Import

```ts
import { VfPanel } from '@codemonster-ru/vueforge-core';
```

## Summary

Content container with optional title and custom header slot.

## Key Props

- `title?: string`
- `subtle?: boolean` (default: `false`)

## Slots

- `header`
- `default`

## Usage

````playground-src
mode: component
framework: vue
height: 280
entry: /App.vue

```vue file=/App.vue
<template>
  <VfPanel title="Recent Activity">
    <ul style="margin:0;padding-left:18px">
      <li>Updated docs structure</li>
      <li>Added interactive examples</li>
    </ul>
  </VfPanel>
</template>

<script setup>
import { VfPanel } from '@codemonster-ru/vueforge-core';
</script>
```
````
