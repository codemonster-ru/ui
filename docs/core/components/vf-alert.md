---
title: "VfAlert"
description: "Component documentation for VfAlert"
slug: "/vueforge/core/components/vf-alert"
order: 2
---

# VfAlert

## Import

```ts
import { VfAlert } from '@codemonster-ru/vueforge-core';
```

## Summary

Feedback component for status and contextual messages.

## Key Props

- `tone?: VfFeedbackTone` (default: `primary`)
- `title?: string`
- `icon?: IconName | string`
- `hideIcon?: boolean` (default: `false`)

## Slots

- `default`: alert body content.
- `icon`: custom leading icon.
- `title`: custom title markup.

## Usage

````playground-src
mode: component
framework: vue
height: 260
entry: /App.vue

```vue file=/App.vue
<template>
  <div style="display:grid;gap:10px">
    <VfAlert tone="success" title="Saved">
      Changes were saved successfully.
    </VfAlert>
    <VfAlert tone="warn" title="Attention">
      Double-check required fields before publishing.
    </VfAlert>
  </div>
</template>

<script setup>
import { VfAlert } from '@codemonster-ru/vueforge-core';
</script>
```
````
