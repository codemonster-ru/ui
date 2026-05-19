---
title: "VfCard"
description: "Component documentation for VfCard"
slug: "/vueforge/core/components/vf-card"
order: 6
---

# VfCard

## Import

```ts
import { VfCard } from '@codemonster-ru/vueforge-core';
```

## Summary

Surface container for grouped content.

## Key Props

- `title?: string`
- `compact?: boolean` (default: `false`)

## Slots

- `default`: card body.
- `header`: replaces title/header region.
- `footer`: footer region.

## Usage

````playground-src
mode: component
framework: vue
height: 300
entry: /App.vue

```vue file=/App.vue
<template>
  <VfCard title="Project Summary">
    <p style="margin:0 0 10px">VueForge docs migration is in progress.</p>
    <ul style="margin:0;padding-left:18px">
      <li>Components documented: 42</li>
      <li>Interactive examples: enabled</li>
    </ul>

    <template #footer>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button>Cancel</button>
        <button>Continue</button>
      </div>
    </template>
  </VfCard>
</template>

<script setup>
import { VfCard } from '@codemonster-ru/vueforge-core';
</script>
```
````
