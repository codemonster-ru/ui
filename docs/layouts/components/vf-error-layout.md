---
title: "VfErrorLayout"
description: "Component documentation for VfErrorLayout"
slug: "/vueforge/layouts/components/vf-error-layout"
order: 19
---

# VfErrorLayout

## Import

```ts
import { VfErrorLayout } from '@codemonster-ru/vueforge-layouts';
```

## Summary

Dedicated error page layout with slots for code, title, description, and actions.

## Key Props

- `as?: string` (default: `section`)
- `code?: string | number | null` (default: `null`)
- `title?: string | null` (default: `null`)
- `description?: string | null` (default: `null`)
- `fillViewport?: boolean` (default: `true`)
- `centered?: boolean` (default: `true`)
- `surface?: boolean` (default: `true`)

## Slots

- `code`
- `title`
- `description`
- `actions`

## Usage

````playground-src
mode: component
framework: vue
height: 360
entry: /App.vue

```vue file=/App.vue
<template>
  <VfErrorLayout
    code="404"
    title="Page not found"
    description="The page you requested does not exist or was moved."
    :fill-viewport="false"
  >
    <template #actions>
      <div style="display:flex;gap:8px;justify-content:center">
        <button>Go Home</button>
        <button>Contact Support</button>
      </div>
    </template>
  </VfErrorLayout>
</template>

<script setup>
import { VfErrorLayout } from '@codemonster-ru/vueforge-layouts';
</script>
```
````
